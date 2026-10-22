import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import pg from "pg";

export async function prepareFullDemo() {
  const databaseUrl = "postgresql://postgres:postgres@127.0.0.1:54330/postgres";
  const env = { ...process.env, APP_ENV: "demo", LOCAL_DB_DIR: resolve(".data/presentation/postgres"), LOCAL_DB_PORT: "54330" };
  let database;
  async function ready() {
    const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 1000 });
    try { await client.connect(); await client.query("SELECT 1"); return true; }
    catch { return false; }
    finally { await client.end().catch(() => {}); }
  }
  async function run(script, args, environment) {
    const child = spawn(process.execPath, [script, ...args], { stdio: "inherit", windowsHide: true, env: environment });
    const [code] = await once(child, "exit");
    if (code !== 0) throw new Error(`Falha na preparação da demonstração: ${script}.`);
  }
  try {
    const alreadyRunning = await ready();
    if (alreadyRunning && !existsSync(resolve(".data/presentation/credentials.json"))) throw new Error("A porta 54330 está ocupada por um banco não identificado. Nenhuma alteração foi aplicada.");
    if (!alreadyRunning) {
      database = spawn(process.execPath, ["scripts/local-db.mjs"], { stdio: "inherit", windowsHide: true, env });
      let started = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        if (await ready()) { started = true; break; }
        if (database.exitCode !== null) break;
        await delay(250);
      }
      if (!started) throw new Error("O banco da demonstração não iniciou.");
    }
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"], { ...env, DATABASE_URL: databaseUrl });
    // The setup reads the original DATABASE_URL and only copies public catalog data.
    await run("node_modules/tsx/dist/cli.mjs", ["scripts/setup-full-demo.ts"], process.env);
    const credentials = JSON.parse(await readFile(".data/presentation/credentials.json", "utf8"));
    return {
      database,
      credentials,
      env: { DATABASE_URL: databaseUrl, AUTH_SECRET: credentials.authSecret, APP_ENV: "demo", DEMO_MODE: "true", PRESENTATION_MODE: "false", STORAGE_PROVIDER: "local", UPLOAD_DIR: resolve(".data/presentation/uploads"), TRUST_PROXY: "true" },
    };
  } catch (error) { database?.kill(); throw error; }
}
