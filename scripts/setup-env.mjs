import { readFile, appendFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const existing = await readFile(".env.local", "utf8").catch(() => "");
const values = { DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54329/postgres", APP_ENV: "development", AUTH_SECRET: randomBytes(48).toString("hex"), SITE_URL: "http://127.0.0.1:3000", OTP_PROVIDER: "development", STORAGE_PROVIDER: "local", UPLOAD_DIR: ".data/uploads" };
const lines = Object.entries(values).filter(([key]) => !new RegExp(`^${key}=`, "m").test(existing)).map(([key, value]) => `${key}=${value}`);
if (lines.length) await appendFile(".env.local", `\n${lines.join("\n")}\n`);
console.log("Configuração local preparada; valores existentes preservados.");
