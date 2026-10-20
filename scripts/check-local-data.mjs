import { config } from "dotenv";
import pg from "pg";
config({ path: ".env.local", quiet: true });
if (process.env.APP_ENV === "production") throw new Error("Este utilitário é exclusivo do ambiente local.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const stale = await client.query('SELECT id, label FROM "CustomField" WHERE label ~ $1 AND NOT EXISTS (SELECT 1 FROM "PropertyValue" WHERE "fieldId" = "CustomField".id)', ['^Vista de teste (desktop|mobile)-[0-9]{13}$']);
  for (const row of stale.rows) await client.query('DELETE FROM "CustomField" WHERE id = $1', [row.id]);
  const counts = await client.query('SELECT (SELECT count(*) FROM "Property") AS properties, (SELECT count(*) FROM "Lead") AS leads, (SELECT count(*) FROM "Admin") AS admins, (SELECT count(*) FROM "SiteSettings") AS settings');
  console.log({ removedTemporaryTestFields: stale.rowCount, persistedRecords: counts.rows[0] });
} finally { await client.end(); }
