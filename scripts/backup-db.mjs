import { mkdir, writeFile } from "node:fs/promises";
import pg from "pg";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const connectionString = process.argv.includes("--demo") ? "postgresql://postgres:postgres@127.0.0.1:54330/postgres" : process.env.DATABASE_URL;
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  const tables = {};
  for (const { tablename } of rows) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tablename)) throw new Error("Unexpected table name");
    tables[tablename] = (await client.query(`SELECT * FROM "${tablename}"`)).rows;
  }
  await client.query("COMMIT");
  await mkdir(".data/backups", { recursive: true });
  const name = `.data/backups/${process.argv.includes("--demo") ? "demo" : "local"}-${Date.now()}.json`;
  await writeFile(name, JSON.stringify(tables), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ backup: name, properties: tables.Property?.length, leads: tables.Lead?.length, selections: tables.Selection?.length }));
} finally { await client.end(); }
