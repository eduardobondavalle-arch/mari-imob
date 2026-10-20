import { spawn } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { createPresentationProxy } from "./presentation-proxy.mjs";

const root = process.cwd();
const full = process.argv.includes("--full");
const binary = resolve(root, ".cache/tools/cloudflared.exe");
await access(binary);
await access(resolve(root, ".next/BUILD_ID"));
await mkdir(resolve(root, ".cache"), { recursive: true });
const demo = full ? await (await import("./full-demo-runtime.mjs")).prepareFullDemo() : null;
const proxy = createPresentationProxy(3002, full ? { mode: "full", ...demo.credentials } : {});
await new Promise((done, reject) => {
  proxy.once("error", reject);
  proxy.listen(3001, "127.0.0.1", done);
});
const tunnel = spawn(binary, ["tunnel", "--no-autoupdate", "--protocol", "http2", "--url", "http://127.0.0.1:3001"], { cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let web;
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  tunnel.kill();
  web?.kill();
  demo?.database?.kill();
  proxy.close();
  setTimeout(() => process.exit(), 1000).unref();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
tunnel.once("exit", (code) => { if (!closing) { console.error("Túnel encerrado:", code); stop(); } });
try {
  const url = await new Promise((done, reject) => {
    const timeout = setTimeout(() => reject(new Error("Não foi possível abrir o túnel em 60 segundos.")), 60000);
    let output = "";
    function onData(chunk) {
      const text = chunk.toString();
      process.stdout.write(text);
      output = (output + text).slice(-16000);
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) { clearTimeout(timeout); done(match[0]); }
    }
    tunnel.stdout.on("data", onData);
    tunnel.stderr.on("data", onData);
    tunnel.once("error", (error) => { clearTimeout(timeout); reject(error); });
    tunnel.once("exit", () => { clearTimeout(timeout); reject(new Error("Túnel indisponível.")); });
  });
  web = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3002"], {
    cwd: root, windowsHide: true, stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production", APP_ENV: "development", PRESENTATION_MODE: "true", DEMO_MODE: "false", ...demo?.env, SITE_URL: url },
  });
  web.once("error", (error) => { console.error(error.message); stop(); });
  web.once("exit", (code) => { if (!closing) { console.error("Apresentação encerrada:", code); stop(); } });
  const info = { url, mode: full ? "full" : "catalog", launcherPid: process.pid, tunnelPid: tunnel.pid, webPid: web.pid, databasePid: demo?.database?.pid, startedAt: new Date().toISOString() };
  await writeFile(resolve(root, ".cache/share-preview.json"), JSON.stringify(info, null, 2));
  console.log(`\nLINK DA APRESENTAÇÃO: ${url}\nMantenha este computador ligado e conectado.\n`);
} catch (error) {
  console.error(error.message);
  stop();
  process.exitCode = 1;
}
