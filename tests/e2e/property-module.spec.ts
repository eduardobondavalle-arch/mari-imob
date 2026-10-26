import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { adminCredentials } from "./admin-credentials";

test("galeria com cinco fotos, ofertas simultâneas e parcelamento", async ({ page, baseURL }, info) => {
  test.setTimeout(120000);
  const headers = { origin: baseURL! };
  const mediaIds: string[] = [];
  let propertyId = "";
  await page.goto("/admin/login");
  const admin = adminCredentials();
  await page.getByLabel("E-mail", { exact: true }).fill(admin.email);
  await page.getByLabel("Senha", { exact: true }).fill(admin.password);
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const file = await readFile(resolve("public/images/living.webp"));
  try {
    for (let index = 0; index < 6; index++) {
      const response = await page.request.post("/api/admin/upload", {
        headers,
        multipart: { file: { name: `foto-${index + 1}.webp`, mimeType: "image/webp", buffer: file } },
      });
      expect(response.ok()).toBe(true);
      mediaIds.push((await response.json()).id);
    }
    const settings = await (await page.request.get("/api/admin/settings")).json();
    const installment = settings.tags.find((tag: { key?: string }) => tag.key === "installment");
    expect(installment).toBeTruthy();
    const unique = Date.now().toString();
    const payload = {
      title: `Imóvel multifinalidade ${unique}`,
      headline: "Teste isolado do módulo de imóveis",
      purpose: "sale",
      price: 3800000,
      offers: [
        { purpose: "sale", price: 3800000, active: true },
        { purpose: "rent", price: 15000, active: true },
      ],
      type: "Apartamento",
      status: "published",
      featured: false,
      superFeatured: false,
      condominiumFee: 1500,
      condominiumPeriod: "monthly",
      iptuFee: 350,
      iptuPeriod: "monthly",
      trashFee: null,
      trashPeriod: null,
      otherFees: null,
      otherFeesPeriod: null,
      otherFeesDescription: "",
      city: "Balneário Camboriú",
      neighborhood: "Centro",
      publicAddress: "Centro",
      privateAddress: "",
      description: "Imóvel temporário usado apenas no teste automatizado do módulo.",
      videoUrl: "",
      bedrooms: 4,
      suites: 2,
      bathrooms: 3,
      parking: 2,
      area: 180,
      categoryId: null,
      situationId: null,
      tagIds: [installment.id],
      imageIds: mediaIds.slice(0, 5),
      customValues: {},
    };
    const created = await page.request.post("/api/admin/properties", { headers, data: payload });
    expect(created.ok()).toBe(true);
    propertyId = (await created.json()).id;
    let row = (await (await page.request.get(`/api/admin/properties?q=${unique}`)).json())[0];
    expect(row.images).toHaveLength(5);
    expect(row.offers).toEqual(expect.arrayContaining([
      expect.objectContaining({ purpose: "sale", price: 3800000 }),
      expect.objectContaining({ purpose: "rent", price: 15000 }),
    ]));
    await page.goto(`/imovel/${row.slug}?purpose=rent`);
    await expect(page.locator(".property-characteristics")).toBeVisible();
    await expect(page.locator(".tag-list")).toContainText("Aceita parcelamento");
    await expect(page.locator(".detail-price")).toContainText("15.000");
    const columns = await page.locator(".property-characteristics").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(info.project.name === "mobile" ? 1 : 2);
    const sale = await (await page.request.get(`/api/properties?purpose=sale&q=${unique}`)).json();
    const rent = await (await page.request.get(`/api/properties?purpose=rent&q=${unique}`)).json();
    expect(sale.items[0].price).toBe(3800000);
    expect(rent.items[0].price).toBe(15000);
    const edited = { ...payload, offers: [payload.offers[0]], imageIds: [mediaIds[1], mediaIds[0], mediaIds[2], mediaIds[3], mediaIds[5]] };
    const updated = await page.request.put(`/api/admin/properties/${propertyId}`, { headers, data: edited });
    expect(updated.ok()).toBe(true);
    row = (await (await page.request.get(`/api/admin/properties?q=${unique}`)).json())[0];
    expect(row.images.map((image: { id: string }) => image.id)).toEqual(edited.imageIds);
    expect(row.offers.map((offer: { purpose: string }) => offer.purpose)).toEqual(["sale"]);
    expect((await (await page.request.get(`/api/properties?purpose=rent&q=${unique}`)).json()).items).toHaveLength(0);
    expect((await (await page.request.get(`/api/properties?purpose=sale&tag=${installment.id}&q=${unique}`)).json()).items[0].id).toBe(propertyId);
  } finally {
    if (propertyId) await page.request.delete(`/api/admin/properties/${propertyId}`, { headers, data: {} });
    for (const id of mediaIds) await page.request.delete(`/api/admin/media/${id}`, { headers, data: {} });
  }
});
