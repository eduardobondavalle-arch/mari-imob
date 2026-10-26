import { describe, expect, it } from "vitest";
import { propertySchema } from "@/lib/mari/validation";
import { catalogWhere } from "@/lib/mari/search-filters";

const base = {
  title: "Apartamento com duas finalidades",
  headline: "",
  purpose: "sale" as const,
  type: "Apartamento",
  status: "published" as const,
  featured: false,
  superFeatured: false,
  price: 3800000,
  condominiumFee: 1500,
  condominiumPeriod: "monthly" as const,
  iptuFee: 350,
  iptuPeriod: "monthly" as const,
  trashFee: null,
  trashPeriod: null,
  otherFees: null,
  otherFeesPeriod: null,
  otherFeesDescription: "",
  city: "Balneário Camboriú",
  neighborhood: "Centro",
  publicAddress: "",
  privateAddress: "",
  description: "Descrição válida do imóvel.",
  videoUrl: "",
  bedrooms: 3,
  suites: 1,
  bathrooms: 2,
  parking: 2,
  area: 140,
  categoryId: null,
  situationId: null,
  tagIds: ["tag-installment"],
  imageIds: [],
  customValues: { seaView: false, floor: 0 },
};

describe("ofertas comerciais do imóvel", () => {
  it("aceita venda e locação com preços independentes", () => {
    const parsed = propertySchema.parse({
      ...base,
      offers: [
        { purpose: "sale", price: 3800000, active: true },
        { purpose: "rent", price: 15000, active: true },
      ],
    });
    expect(parsed.offers).toEqual([
      { purpose: "sale", price: 3800000, active: true },
      { purpose: "rent", price: 15000, active: true },
    ]);
    expect(parsed.customValues).toMatchObject({ seaView: false, floor: 0 });
  });

  it("vincula finalidade e faixa de preço à mesma oferta", () => {
    const params = new URLSearchParams({ purpose: "rent", minPrice: "10000", maxPrice: "20000" });
    const where = catalogWhere(params, []);
    expect(JSON.stringify(where)).toContain('"purpose":"rent"');
    expect(JSON.stringify(where)).toContain('"price":{"gte":10000,"lte":20000}');
    expect(JSON.stringify(where)).toContain('"active":true');
  });

  it("inclui a finalidade de temporada quando configurada", () => {
    const where = catalogWhere(new URLSearchParams({ purpose: "season" }), []);
    expect(JSON.stringify(where)).toContain('"purpose":"season"');
  });
});
