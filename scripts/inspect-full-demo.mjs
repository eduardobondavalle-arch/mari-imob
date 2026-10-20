import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const { url } = JSON.parse(await readFile(".cache/share-preview.json", "utf8"));
const { email, password } = JSON.parse(await readFile(".data/presentation/credentials.json", "utf8"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ httpCredentials: { username: email, password }, extraHTTPHeaders: { origin: url } });
  const page = await context.newPage();
  page.on("pageerror", e => console.log("JS", e.message));
  page.on("response", r => { if (r.status() >= 400) console.log("HTTP", r.status(), new URL(r.url()).pathname); });
  const data = await (await context.request.get(`${url}/api/properties`)).json();
  console.log("Public total", data.total);
  const code = data.items[0].code;
  await page.goto(`${url}/buscar?q=${encodeURIComponent(code)}`);
  for (let i = 0; i < 4; i++) {
    console.log({ url: page.url(), cards: await page.locator(".listing-card").count(), titles: await page.locator(".listing-card h3").allTextContents() });
    await page.waitForTimeout(700);
  }
  await page.goto(`${url}/admin/login`);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await page.waitForURL(`${url}/admin`);
  for (const name of ["dashboard", "properties", "leads", "board", "appointments", "appointment-types", "settings"]) {
    const response = await context.request.get(`${url}/api/admin/${name}`);
    console.log("Module", name, response.status());
  }
} finally { await browser.close(); }
