import { config } from "dotenv";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import pg from "pg";

function start(script, args = []) {
  return spawn(process.execPath, [script, ...args], { stdio: "inherit", windowsHide: true, env: process.env });
}
async function run(script, args = []) {
  const child = start(script, args);
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`Falha ao executar ${script} (código ${code}).`);
}
if (!existsSync(".env.local")) await run("scripts/setup-env.mjs");
config({ path: ".env.local", quiet: true });
config({ quiet: true });
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54329/postgres";
process.env.DATABASE_URL = databaseUrl;
const url = new URL(databaseUrl);
const localDatabase = process.env.APP_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "54329";
let databaseProcess;
let nextProcess;
let closing = false;
async function databaseReady() {
  const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 1000 });
  try { await client.connect(); await client.query("SELECT 1"); return true; } catch { return false; } finally { await client.end().catch(() => {}); }
}
async function shutdown() {
  if (closing) return;
  closing = true;
  if (nextProcess && nextProcess.exitCode === null) nextProcess.kill("SIGTERM");
  if (databaseProcess && databaseProcess.exitCode === null) databaseProcess.kill("SIGTERM");
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
try {
  if (localDatabase && !(await databaseReady())) {
    console.log("Iniciando o banco PostgreSQL local persistente…");
    databaseProcess = start("scripts/local-db.mjs");
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) { if (await databaseReady()) { ready = true; break; } if (databaseProcess.exitCode !== null) break; await delay(250); }
    if (!ready) throw new Error("O banco local não iniciou. Consulte a mensagem acima.");
  }
  if (!existsSync("src/generated/prisma/client.ts")) await run("node_modules/prisma/build/index.js", ["generate"]);
  if (localDatabase) {
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
    await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  }
  nextProcess = start("node_modules/next/dist/bin/next", ["dev", "--hostname", "127.0.0.1", ...process.argv.slice(2)]);
  const [code] = await once(nextProcess, "exit");
  process.exitCode = code || 0;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await shutdown(); }
