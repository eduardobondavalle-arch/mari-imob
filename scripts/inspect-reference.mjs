import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("docs/referencia", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const routes = [
  ["inicio", "https://www.imobiliariacri.com.br/"],
  ["busca", "https://www.imobiliariacri.com.br/buscar?city=balneario-camboriu"],
  ["sobre", "https://www.imobiliariacri.com.br/sobre-nos"],
  ["contato", "https://www.imobiliariacri.com.br/contato"],
  [
    "detalhe",
    "https://www.imobiliariacri.com.br/imovel/apartamento-a-venda-com-3-suites-no-shard-tower-em-itapema-IM02038",
  ],
  ["adim", "https://www.adimalugueis.com.br/sobre"],
];
for (const [name, url] of routes) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: `docs/referencia/${name}-desktop.png`,
      fullPage: true,
    });
    const info = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText.slice(0, 18000),
      links: [...document.querySelectorAll("a")]
        .map((a) => ({ text: a.innerText, url: a.href }))
        .filter((a) => a.text),
      images: [...document.images].map((i) => ({
        alt: i.alt,
        src: i.currentSrc,
      })),
      styles: [...document.querySelectorAll("body,h1,h2,header,button,a")]
        .slice(0, 85)
        .map((el) => {
          const s = getComputedStyle(el);
          return {
            tag: el.tagName,
            text: el.textContent?.slice(0, 60),
            font: s.fontFamily,
            size: s.fontSize,
            color: s.color,
            background: s.backgroundColor,
            radius: s.borderRadius,
          };
        }),
    }));
    await fs.writeFile(
      `docs/referencia/${name}.json`,
      JSON.stringify(info, null, 2),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `docs/referencia/${name}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    console.log(name, info.title, info.text.slice(0, 200));
  } catch (e) {
    console.log(name, e.message);
  }
}
await browser.close();
