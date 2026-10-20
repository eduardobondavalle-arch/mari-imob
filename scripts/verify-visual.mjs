import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
await fs.mkdir("docs/capturas", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = [];
for (const width of [1440, 390, 360, 768]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 844 : 1000 },
  });
  const page = await context.newPage();
  for (const [name, path] of [
    ["inicio", "/"],
    ["busca", "/buscar"],
    ["detalhe", "/imovel/apartamento-centro-DEMO001"],
    ["contato", "/contato"],
    ["sobre", "/sobre"],
    ["proprietarios", "/proprietarios"],
  ]) {
    await page.goto(`http://127.0.0.1:3000${path}`, {
      waitUntil: "networkidle",
    });
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 650) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(200);
    const images = await page.locator("img").evaluateAll((els) =>
      els
        .filter((i) => i.getClientRects().length > 0)
        .map((i) => ({
          src: i.getAttribute("src"),
          loaded: i.complete && i.naturalWidth > 0,
        })),
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    const entry = {
      width,
      name,
      overflow,
      brokenImages: images.filter((i) => !i.loaded),
    };
    if (width === 1440 || width === 390) {
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      entry.violations = axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes
          .map((n) => ({ target: n.target, summary: n.failureSummary }))
          .slice(0, 12),
      }));
    }
    const suffix =
      width === 1440 ? "desktop" : width === 390 ? "mobile" : String(width);
    await page.screenshot({
      path: `docs/capturas/${name}-${suffix}.png`,
      fullPage: true,
    });
    if (name === "inicio")
      await page.screenshot({
        path: `docs/capturas/inicio-viewport-${suffix}.png`,
      });
    report.push(entry);
    console.log(
      width,
      name,
      "overflow:",
      overflow,
      "broken:",
      entry.brokenImages.length,
      "a11y:",
      entry.violations?.map((v) => v.id).join(",") || "ok",
    );
  }
  await context.close();
}
await fs.writeFile(
  "docs/verificacao-visual.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
if (
  report.some(
    (r) => r.overflow || r.brokenImages.length || r.violations?.length,
  )
)
  process.exitCode = 1;
