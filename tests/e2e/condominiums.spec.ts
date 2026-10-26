import { expect, test } from "@playwright/test";
import { adminCredentials } from "./admin-credentials";

test("administra condomínio, preserva ordem e exibe dados no imóvel", async ({ page }) => {
  const credentials = adminCredentials();
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  const stamp = Date.now();
  const condominium = await page.evaluate(async (stamp) => {
    const response = await fetch("/api/admin/condominiums", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Residencial Teste ${stamp}`, city: "Itajaí", neighborhood: "Praia Brava", street: "Rua de Teste", number: "100", complement: "", postalCode: "88306-000", description: "Condomínio criado pelo teste automatizado.", amenities: ["Piscina", "Academia"], imageIds: [], archived: false }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }, stamp);

  await page.goto("/admin?tab=condominiums");
  await expect(page.getByRole("heading", { name: "Condomínios" }).first()).toBeVisible();
  await page.getByLabel("Buscar condomínios").fill(`Residencial Teste ${stamp}`);
  await expect(page.getByText(`Residencial Teste ${stamp}`, { exact: true })).toBeVisible();

  const property = await page.evaluate(async ({ stamp, condominiumId }) => {
    const response = await fetch("/api/admin/properties", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Apartamento teste condomínio ${stamp}`, headline: "", purpose: "sale", type: "Apartamento", status: "published", featured: false, superFeatured: false, price: 1000000, offers: [{ purpose: "sale", price: 1000000, active: true }], condominiumFee: null, condominiumPeriod: null, iptuFee: null, iptuPeriod: null, trashFee: null, trashPeriod: null, otherFees: null, otherFeesPeriod: null, otherFeesDescription: "", city: "Itajaí", neighborhood: "Praia Brava", publicAddress: "Praia Brava", privateAddress: "", description: "Imóvel criado para validar a integração com o condomínio.", videoUrl: "", bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 90, builtArea: 100, landArea: null, condominiumId, categoryId: null, situationId: null, tagIds: [], imageIds: [], customValues: {} }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }, { stamp, condominiumId: condominium.id });

  await page.goto(`/imovel/${property.slug}`);
  await expect(page.getByRole("heading", { name: "Sobre o condomínio" })).toBeVisible();
  await expect(page.getByText(`Residencial Teste ${stamp}`, { exact: true })).toBeVisible();
  await expect(page.getByText("Piscina", { exact: true })).toBeVisible();
  await expect(page.getByText("100 m²")).toBeVisible();

  await page.evaluate(async ({ propertyId, condominiumId }) => {
    await fetch(`/api/admin/properties/${propertyId}`, { method: "DELETE" });
    await fetch(`/api/admin/condominiums/${condominiumId}`, { method: "DELETE" });
  }, { propertyId: property.id, condominiumId: condominium.id });
});
