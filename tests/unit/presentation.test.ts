import { describe, expect, it } from "vitest";
import { createPresentationProxy, isFullDemoRequest, isPublicRequest } from "../../scripts/presentation-proxy.mjs";
import http from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";

describe("presentation gateway", () => {
  it.each(["/", "/buscar?city=Itajai", "/imovel/apartamento-DEMO001", "/api/properties?q=praia", "/media/123-abc.webp", "/_next/static/chunks/app.js", "/_next/image?url=%2Fmedia%2Fabc.webp&w=640&q=75"])("allows public catalog request %s", (path) => {
    expect(isPublicRequest("GET", path)).toBe(true);
  });
  it.each(["/admin", "/admin/login", "/editor-preview", "/api/admin/leads", "/api/client/otp", "/api/client/account", "/selecao/private", "/.env.local", "/_next/static/app.js.map", "/__nextjs_original-stack-frame", "/_next/webpack-hmr", "/api/properties/../admin", "/api/properties/%2e%2e/admin", "/api/properties/..%5cadmin", "//localhost/admin", "/_next/image?url=%2Fapi%2Fadmin%2Fleads", "/_next/image?url=https%3A%2F%2Fexample.com%2Fimage.png", "/_next/image?url=%2Fimages%2F..%2F..%2F.env.local"])("denies private or indirect request %s", (path) => {
    expect(isPublicRequest("GET", path)).toBe(false);
  });
  it.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])("rejects %s even on public pages", (method) => {
    expect(isPublicRequest(method, "/")).toBe(false);
    expect(isPublicRequest(method, "/api/properties")).toBe(false);
  });
});

describe("complete demo gateway", () => {
  it.each([["GET", "/admin"], ["GET", "/editor-preview"], ["GET", "/selecao/demo-token"], ["POST", "/api/admin/login"], ["POST", "/api/admin/upload"], ["PUT", "/api/admin/properties/123"], ["DELETE", "/api/selection/123"]])("allows %s %s with gateway authentication", (method, path) => {
    expect(isFullDemoRequest(method, path)).toBe(true);
  });
  it.each(["/.env.local", "/_next/webpack-hmr", "/_next/static/test.js.map", "/api/../admin", "/api/%2e%2e/admin", "/_next/image?url=%2Fapi%2Fadmin%2Fleads"])("still blocks %s", path => {
    expect(isFullDemoRequest("GET", path)).toBe(false);
  });
  it("requires credentials, preserves sessions and payloads, and strips injected headers", async () => {
    const password = "random-test-password-very-long";
    const upstream = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      res.setHeader("set-cookie", "mari_admin=test; HttpOnly; Secure; SameSite=Lax");
      res.end(JSON.stringify({ headers: req.headers, body: Buffer.concat(chunks).toString() }));
    });
    upstream.listen(0, "127.0.0.1"); await once(upstream, "listening");
    const proxy = createPresentationProxy((upstream.address() as AddressInfo).port, { mode: "full", email: "demo@example.com", password });
    proxy.listen(0, "127.0.0.1"); await once(proxy, "listening");
    const url = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}/api/admin/dashboard`;
    try {
      expect((await fetch(url)).status).toBe(401);
      expect((await fetch(url, { headers: { authorization: "Basic invalid" } })).status).toBe(401);
      expect((await fetch(url.replace("/api/admin/dashboard", "/selecao/random-public-token"))).status).toBe(200);
      const response = await fetch(url, { method: "POST", headers: {
        authorization: `Basic ${Buffer.from(`demo@example.com:${password}`).toString("base64")}`,
        origin: "https://demo.example.com", cookie: "mari_admin=session", "content-type": "application/json", "x-middleware-subrequest": "bypass", "x-forwarded-for": "forged-ip",
      }, body: '{"email":"test"}' });
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("HttpOnly; Secure");
      const data = await response.json();
      expect(data.body).toBe('{"email":"test"}');
      expect(data.headers.cookie).toBe("mari_admin=session");
      expect(data.headers.origin).toBe("https://demo.example.com");
      expect(data.headers.authorization).toBeUndefined();
      expect(data.headers["x-middleware-subrequest"]).toBeUndefined();
      expect(data.headers["x-forwarded-for"]).toBe("demo-local");
    } finally { proxy.closeAllConnections(); proxy.close(); upstream.closeAllConnections(); upstream.close(); }
  });
});
