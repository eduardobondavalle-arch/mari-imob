import { readFile } from "node:fs/promises";
import { scryptSync, timingSafeEqual, createHash } from "node:crypto";
import pg from "pg";

const state = JSON.parse(await readFile(".cache/share-preview.json", "utf8"));
const credentials = JSON.parse(await readFile(".data/presentation/credentials.json", "utf8"));
for (const [name, port, password] of [["local", 54329, "Admin"], ["demo", 54330, credentials.password]]) {
  const db = new pg.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`, connectionTimeoutMillis: 3000 });
  try {
    await db.connect();
    const { rows } = await db.query('SELECT "passwordHash", "mustChangePassword" FROM "Admin" WHERE email = $1', [credentials.email]);
    const [salt, hash] = (rows[0]?.passwordHash || "").split(":");
    const valid = salt && hash ? timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex")) : false;
    const bucket = Math.floor(Date.now() / 900000);
    const key = createHash("sha256").update(`admin:${credentials.email}:${bucket}`).digest("hex");
    const rate = await db.query('SELECT count FROM "RateLimit" WHERE key = $1', [key]);
    console.log(JSON.stringify({ database: name, adminExists: Boolean(rows[0]), passwordMatches: valid, attemptsThisWindow: rate.rows[0]?.count || 0 }));
  } catch (error) { console.log(JSON.stringify({ database: name, error: error.message })); }
  finally { await db.end(); }
}

const cases = process.argv.includes("--external")
  ? [["external", state.url, state.url, credentials.password, true]]
  : [["demo-gateway", "http://127.0.0.1:3001", state.url, credentials.password, true], ["local-127", "http://127.0.0.1:3000", "http://127.0.0.1:3000", "Admin", false], ["local-hostname", "http://localhost:3000", "http://localhost:3000", "Admin", false]];
for (const [name, base, origin, password, gateway] of cases) {
  try {
    const headers = { "Content-Type": "application/json", Origin: origin, ...(gateway ? { Authorization: `Basic ${Buffer.from(`${credentials.email}:${credentials.password}`).toString("base64")}` } : {}) };
    const response = await fetch(`${base}/api/admin/login`, { method: "POST", headers, body: JSON.stringify({ email: credentials.email, password }), signal: AbortSignal.timeout(15000) });
    const contentType = response.headers.get("content-type");
    const body = await response.text();
    const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    console.log(JSON.stringify({ endpoint: name, status: response.status, contentType, body: body.slice(0, 250), sessionCookie: Boolean(cookie) }));
    if (response.ok && cookie) {
      const panel = await fetch(`${base}/admin`, { headers: { ...headers, Cookie: cookie }, redirect: "manual", signal: AbortSignal.timeout(15000) });
      console.log(JSON.stringify({ endpoint: name, panelStatus: panel.status, redirect: panel.headers.get("location") }));
      await fetch(`${base}/api/admin/logout`, { method: "POST", headers: { ...headers, Cookie: cookie }, body: "{}", signal: AbortSignal.timeout(15000) });
    }
  } catch (error) { console.log(JSON.stringify({ endpoint: name, error: error.message })); }
}
