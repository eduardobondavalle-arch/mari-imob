import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const findings = [];
await page.goto("https://www.imobiliariacri.com.br/", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(2000);
findings.push({
  step: "desktop-controls",
  buttons: await page.getByRole("button").allTextContents(),
});
await page.getByText("Pronto para morar", { exact: true }).first().hover();
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/referencia/menu-desktop.png" });
findings.push({
  step: "hover-menu",
  text: await page.locator("body").innerText(),
});
await page.setViewportSize({ width: 390, height: 844 });
const candidates = await page
  .locator("button")
  .evaluateAll((els) =>
    els
      .filter(
        (e) =>
          e.getBoundingClientRect().top < 120 &&
          e.getBoundingClientRect().width > 0,
      )
      .map((e) => ({
        text: e.innerText,
        aria: e.getAttribute("aria-label"),
        html: e.outerHTML.slice(0, 500),
      })),
  );
findings.push({ step: "mobile-controls", candidates });
const menu = page.getByRole("button", { name: /menu/i }).first();
if (await menu.count()) {
  await menu.click();
  await page.screenshot({ path: "docs/referencia/menu-mobile.png" });
  findings.push({
    step: "mobile-menu",
    text: await page.locator("body").innerText(),
  });
}
await page.goto(
  "https://www.imobiliariacri.com.br/buscar?city=balneario-camboriu",
  { waitUntil: "domcontentloaded" },
);
await page.waitForTimeout(2000);
findings.push({
  step: "search-inputs",
  inputs: await page
    .locator("input")
    .evaluateAll((els) =>
      els.map((e) => ({
        placeholder: e.placeholder,
        name: e.name,
        type: e.type,
      })),
    ),
});
await fs.writeFile(
  "docs/referencia/interacoes.json",
  JSON.stringify(findings, null, 2),
);
await browser.close();
console.log("Evidências de menu e controles salvas.");
