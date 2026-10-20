import { chromium, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const { url } = JSON.parse(await readFile(".cache/share-preview.json", "utf8"));
await mkdir("docs/mari", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Prévia para avaliação · Imóveis ilustrativos · Cadastros desativados")).toBeVisible();
    await page.getByRole("button", { name: "Acesso do cliente", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("não coleta dados pessoais");
    await expect(page.getByRole("dialog").locator("input")).toHaveCount(0);
    await page.getByRole("button", { name: "Fechar janela" }).click();
    await page.goto(`${url}/buscar?purpose=sale`, { waitUntil: "domcontentloaded" });
    const cards = page.locator(".listing-card");
    expect(await cards.count()).toBeGreaterThan(0);
    await cards.first().scrollIntoViewIfNeeded();
    const previous = await page.evaluate(() => ({ url: location.href, scroll: scrollY }));
    await cards.first().locator("h3 a").click();
    await expect(page.getByRole("dialog", { name: "Conheça este imóvel" })).toBeVisible();
    const detailUrl = page.url();
    await page.getByRole("button", { name: "Fechar janela" }).click();
    await expect(page).toHaveURL(previous.url);
    expect(Math.abs(await page.evaluate(() => scrollY) - previous.scroll)).toBeLessThan(8);
    await cards.first().locator(".save-button").click();
    await expect(page.getByRole("dialog")).toContainText("não coleta dados pessoais");
    await page.getByRole("button", { name: "Fechar janela" }).click();
    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
    const broken = await page.locator("img").evaluateAll((images) => images.filter((img) => img.loading !== "lazy" && (!img.complete || img.naturalWidth === 0)).map((img) => img.src));
    expect(broken).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    expect(errors).toEqual([]);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: `docs/mari/apresentacao-${name}.png`, fullPage: true });
    console.log(JSON.stringify({ viewport: name, publicUrl: url, catalog: true, modal: true, images: true, noPersonalDataForm: true, errors }));
    await page.close();
  }
} finally { await browser.close(); }

