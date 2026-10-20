import http from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";

const pages = new Set(["/", "/buscar", "/contato", "/privacidade", "/minha-selecao"]);
const publicImage = (path) => /^\/(?:images|brand)\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g|webp|avif|svg|ico)$/.test(path) || /^\/media\/[a-zA-Z0-9-]+\.webp$/.test(path);

// Only public GET routes reach Next. Cookies, auth, rewrite headers, dev
// endpoints, server actions, source maps and WebSockets never pass through.
export function isPublicRequest(method, rawUrl) {
  if (!["GET", "HEAD"].includes(method) || !rawUrl?.startsWith("/") || rawUrl.startsWith("//")) return false;
  const path = rawUrl.split("?")[0];
  if (path.includes("%") || path.includes("\\") || path.includes("..") || path.includes("//")) return false;
  if (pages.has(path) || /^\/imovel\/[a-zA-Z0-9-]+$/.test(path)) return true;
  if (path === "/api/client" || /^\/api\/properties(?:\/[a-zA-Z0-9-]+)?$/.test(path)) return true;
  if (publicImage(path)) return true;
  if (/^\/_next\/static\/[a-zA-Z0-9_./%()[\]@~-]+\.(?:js|css|woff2?|ttf)$/.test(path)) return true;
  if (path === "/_next/image") {
    const parameters = new URL(rawUrl, "http://localhost").searchParams;
    const source = parameters.get("url") || "";
    return !source.includes("..") && !source.includes("//") && publicImage(source);
  }
  return path === "/favicon.ico" || path === "/robots.txt";
}

export function isFullDemoRequest(method, rawUrl) {
  if (isPublicRequest(method, rawUrl)) return true;
  if (!rawUrl?.startsWith("/") || rawUrl.startsWith("//")) return false;
  const path = rawUrl.split("?")[0];
  if (path.includes("%") || path.includes("\\") || path.includes("..") || path.includes("//")) return false;
  if (["GET", "HEAD"].includes(method) && (/^\/admin(?:\/login)?$/.test(path) || path === "/editor-preview" || /^\/selecao\/[a-zA-Z0-9-]+$/.test(path))) return true;
  return ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method) && /^\/api\/[a-zA-Z0-9/-]+$/.test(path);
}

export function createPresentationProxy(targetPort, options = {}) {
  const full = options.mode === "full";
  if (full && (!options.email || !options.password || options.password.length < 16)) throw new Error("A demonstração completa exige credenciais fortes.");
  const hash = value => createHash("sha256").update(value).digest();
  const expectedAuthorization = full ? hash(`Basic ${Buffer.from(`${options.email}:${options.password}`).toString("base64")}`) : null;
  const server = http.createServer({ maxHeaderSize: 16384 }, async (request, response) => {
    response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    const path = request.url?.split("?")[0] || "";
    const privateRoute = path === "/admin" || path === "/editor-preview" || (path.startsWith("/api/admin/") && path !== "/api/admin/login");
    const suppliedSession = /(?:^|;\s*)mari_admin=[a-f0-9]{64}(?:;|$)/.test(request.headers.cookie || "");
    // A cookie is only forwarded, never trusted here: Next validates the persisted
    // session and permissions for every private page/API. Basic remains compatible
    // with automation, while visitors use the normal application login once.
    if (full && privateRoute && !suppliedSession && !timingSafeEqual(hash(request.headers.authorization || ""), expectedAuthorization)) {
      if (!path.startsWith("/api/") && ["GET", "HEAD"].includes(request.method)) {
        response.writeHead(303, { Location: "/admin/login", "Cache-Control": "no-store" }); response.end(); return;
      }
      response.writeHead(401, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ error: "Entre na administração para continuar." }));
      return;
    }
    if (!(full ? isFullDemoRequest : isPublicRequest)(request.method, request.url)) {
      const api = request.url?.startsWith("/api/");
      response.writeHead(403, { "Content-Type": api ? "application/json; charset=utf-8" : "text/html; charset=utf-8", "Cache-Control": "no-store" });
      const message = "Esta prévia permite somente a navegação pelo catálogo. Cadastros e acessos privados estão desativados.";
      response.end(api ? JSON.stringify({ error: message }) : `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Prévia Mari</title><body style="font-family:system-ui;max-width:40rem;margin:15vh auto;padding:24px"><h1>Prévia para avaliação</h1><p>${message}</p><a href="/">Voltar ao site</a></body></html>`);
      return;
    }
    if (request.url === "/robots.txt") {
      response.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      response.end("User-agent: *\nDisallow: /\n");
      return;
    }
    if (!full && request.url?.split("?")[0] === "/api/client") {
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end("null");
      return;
    }
    const headers = { "accept-encoding": "identity" };
    for (const name of ["accept", "accept-language", "rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch", "next-url", ...(full ? ["cookie", "origin", "sec-fetch-site", "content-type"] : [])]) {
      if (request.headers[name]) headers[name] = request.headers[name];
    }
    if (full) headers["x-forwarded-for"] = request.headers["cf-connecting-ip"] || "demo-local";
    let body;
    if (full && !["GET", "HEAD"].includes(request.method)) {
      try {
        let size = 0;
        const chunks = [];
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 9 * 1024 * 1024) {
            response.writeHead(413, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: "Arquivo muito grande. Limite de 8 MB por imagem." }));
            return;
          }
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
        headers["content-length"] = String(body.length);
      } catch { response.destroy(); return; }
    }
    const upstream = http.request({ hostname: "127.0.0.1", port: targetPort, path: request.url, method: request.method, headers, timeout: 30000 }, (result) => {
      for (const [name, value] of Object.entries(result.headers)) {
        if (value !== undefined && ![...(!full ? ["set-cookie"] : []), "connection", "keep-alive", "transfer-encoding", "x-robots-tag"].includes(name)) response.setHeader(name, value);
      }
      response.statusCode = result.statusCode || 502;
      result.pipe(response);
    });
    upstream.on("timeout", () => upstream.destroy(new Error("timeout")));
    upstream.on("error", () => {
      if (!response.headersSent) response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("A apresentação está iniciando. Atualize a página em instantes.");
    });
    response.on("close", () => upstream.destroy());
    upstream.end(body);
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on("upgrade", (_request, socket) => socket.destroy());
  return server;
}
