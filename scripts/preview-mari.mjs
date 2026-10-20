import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("docs/mari", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await page.screenshot({ path: `docs/mari/visual-${name}.png`, fullPage: true });
    console.log({ viewport: name, title: await page.title(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
    await page.close();
  }
} finally { await browser.close(); }
