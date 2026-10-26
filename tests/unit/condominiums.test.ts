import { describe, expect, it } from "vitest";
import { condominiumSchema, propertySchema } from "@/lib/mari/validation";

describe("cadastro de condomínios", () => {
  it("valida endereço, lazer e ordem das fotografias", () => {
    const parsed = condominiumSchema.parse({
      name: "Edifício Atlântico",
      city: "Balneário Camboriú",
      neighborhood: "Centro",
      street: "Avenida Atlântica",
      number: "1000",
      complement: "",
      postalCode: "88330-000",
      description: "Áreas comuns completas.",
      amenities: ["Piscina", "Academia"],
      imageIds: ["foto-capa", "foto-piscina"],
      archived: false,
    });
    expect(parsed.imageIds).toEqual(["foto-capa", "foto-piscina"]);
    expect(parsed.amenities).toEqual(["Piscina", "Academia"]);
  });

  it("rejeita CEP inválido e aceita condomínio opcional no imóvel", () => {
    expect(() => condominiumSchema.parse({ name: "Teste", city: "Itajaí", neighborhood: "Centro", street: "Rua A", number: "1", postalCode: "123", amenities: [], imageIds: [] })).toThrow("CEP válido");
    const property = propertySchema.parse({
      title: "Apartamento vinculado ao condomínio",
      purpose: "sale", type: "Apartamento", status: "draft", featured: false,
      price: null, city: "Itajaí", neighborhood: "Centro",
      description: "Descrição válida do apartamento.", bedrooms: null, suites: null,
      parking: null, area: null, condominiumId: "condo-1", tagIds: [], imageIds: [], customValues: {},
    });
    expect(property.condominiumId).toBe("condo-1");
    expect(property.builtArea).toBeNull();
  });
});
