import { test, expect } from "@playwright/test";
import { adminCredentials } from "./admin-credentials";

test("intenção de saída apresenta imóveis e cadastra a seleção", async ({ page, browser, baseURL }, info) => {
  test.skip(info.project.name !== "desktop", "O gesto de saída pelo cursor existe apenas no desktop.");
  test.setTimeout(60000);
  const phone = `479${String(Date.now()).slice(-8)}`;
  await page.addInitScript(() => sessionStorage.removeItem("mari_exit_intent_seen"));
  await page.goto("/");
  await page.waitForTimeout(11000);
  await page.evaluate(() => document.documentElement.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, clientY: 0, relatedTarget: null })));
  const dialog = page.getByRole("dialog", { name: "Antes de ir…" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Puxa, não vai embora agora, seu novo imóvel pode estar aqui, deixa eu te chamar e te apresentar as melhores opções!");
  await expect(dialog.locator(".exit-property-list button")).toHaveCount(3);
  await dialog.getByLabel("Primeiro nome").fill("Saída Teste");
  await dialog.getByLabel("Telefone com WhatsApp").fill(phone);
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Quero conhecer as melhores opções" }).click();
  await expect(dialog.getByRole("heading", { name: "Pronto, sua seleção foi criada!" })).toBeVisible();
  const client = await (await page.request.get("/api/client")).json();
  expect(client.items).toHaveLength(1);

  const adminContext = await browser.newContext({
    extraHTTPHeaders: { origin: baseURL! },
    httpCredentials: info.project.use.httpCredentials,
  });
  try {
    const adminPage = await adminContext.newPage();
    const credentials = adminCredentials();
    await adminPage.goto("/admin/login");
    await adminPage.getByLabel("E-mail", { exact: true }).fill(credentials.email);
    await adminPage.getByLabel("Senha", { exact: true }).fill(credentials.password);
    await adminPage.getByRole("button", { name: "Entrar no painel" }).click();
    await expect(adminPage).toHaveURL(/\/admin$/);
    const leads = await (await adminPage.request.get(`/api/admin/leads?q=${phone}`)).json();
    expect(leads).toHaveLength(1);
    await adminPage.request.delete(`/api/admin/leads/${leads[0].id}`, { data: {} });
  } finally {
    await adminContext.close();
  }
});
