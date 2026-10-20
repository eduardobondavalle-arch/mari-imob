import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";

const state = JSON.parse(await readFile(".cache/share-preview.json", "utf8"));
if (state.mode !== "full") throw new Error("A demonstração completa ainda não iniciou.");
const credentials = JSON.parse(await readFile(".data/presentation/credentials.json", "utf8"));
const anonymous = await fetch(`${state.url}/api/admin/leads`);
if (anonymous.status !== 401) throw new Error("O acesso sem credenciais deve estar bloqueado.");
console.log("Acesso externo sem credenciais: bloqueado.");
const child = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], {
  stdio: "inherit", windowsHide: true,
  env: { ...process.env, TEST_BASE_URL: state.url, TEST_GATEWAY_EMAIL: credentials.email, TEST_GATEWAY_PASSWORD: credentials.password, TEST_ADMIN_EMAIL: credentials.email, TEST_ADMIN_PASSWORD: credentials.password },
});
const [code] = await once(child, "exit");
process.exitCode = code;
