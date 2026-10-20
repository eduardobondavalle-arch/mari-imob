import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { url } = JSON.parse(await readFile(".cache/share-preview.json", "utf8"));
const { email, password } = JSON.parse(await readFile(".data/presentation/credentials.json", "utf8"));
const home = await fetch(url, { redirect: "manual" });
assert.equal(home.status, 200);
assert.equal(home.headers.get("www-authenticate"), null);
const loginPage = await fetch(`${url}/admin/login`, { redirect: "manual" });
assert.equal(loginPage.status, 200);
assert.equal(loginPage.headers.get("www-authenticate"), null);
const login = await fetch(`${url}/api/admin/login`, {
  method: "POST",
  headers: { origin: url, "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
assert.equal(login.status, 200, await login.text());
const cookie = login.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
const dashboard = await fetch(`${url}/api/admin/dashboard`, { headers: { cookie } });
assert.equal(dashboard.status, 200);
console.log(JSON.stringify({ url, publicWithoutBrowserLogin: true, adminLogin: true, dashboard: true }));
