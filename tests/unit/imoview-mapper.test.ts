import { describe, expect, it } from "vitest";
import { mapImoviewToProperty, parseBRLCents, slugify } from "../../src/lib/imoview-mapper";

const samplePayload = {
  codigo: 14484,
  titulo: "Apartamento com 2 Suítes no Brava Arts na Praia Brava em Itajaí",
  finalidade: "Venda",
  tipo: "Apartamento",
  situacao: "Vago/Disponível",
  valor: "R$ 2.350.000,00",
  valorcondominio: "R$ 1.000,00",
  valoriptu: "R$ 0,00",
  bairro: "Praia Brava",
  cidade: "Itajaí",
  estado: "SC",
  numeroquartos: "2",
  numerosuites: "2",
  numerovagas: "1",
  areaprincipal: "90,68",
  nomecondominio: "Residencial Brava Arts",
  descricao: "Apresentamos um apartamento de sonho no Brava Arts by Romero Britto...",
  datahoracadastro: "04/04/2025 10:41:49",
  destaque: "Destaque",
  fotos: [
    {
      descricao: "Apartamento à venda Residencial Brava Arts",
      url: "https://cdn.imoview.com.br/crimoveis/Imoveis/14484/tj13-img-8-1743774785.jpg?1743774786",
    },
  ],
  mobiliado: true,
  piscina: true,
  academia: true,
};

describe("Imoview Mapper", () => {
  it("converte valores em BRL para centavos", () => {
    expect(parseBRLCents("R$ 2.350.000,00")).toBe(235000000);
    expect(parseBRLCents("R$ 1.000,00")).toBe(100000);
    expect(parseBRLCents("R$ 0,00")).toBe(0);
  });

  it("gera slugs limpos sem acentos", () => {
    expect(slugify("Itajaí")).toBe("itajai");
    expect(slugify("Praia Brava")).toBe("praia-brava");
  });

  it("mapeia um objeto Imoview para o modelo de domínio Property", () => {
    const p = mapImoviewToProperty(samplePayload);
    expect(p.id).toBe("14484");
    expect(p.code).toBe("14484");
    expect(p.slug).toBe("apartamento-praia-brava-14484");
    expect(p.purpose).toBe("annual-rent");
    expect(p.costs.rent).toBe(235000000);
    expect(p.costs.condominium.amount).toBe(100000);
    expect(p.location.city).toBe("itajai");
    expect(p.location.neighborhood).toBe("praia-brava");
    expect(p.bedrooms).toBe(2);
    expect(p.suites).toBe(2);
    expect(p.parking).toBe(1);
    expect(p.area).toBe(90.68);
    expect(p.media[0].url).toContain("cdn.imoview.com.br");
    expect(p.building?.name).toBe("Residencial Brava Arts");
    expect(p.building?.amenities).toContain("Piscina");
    expect(p.building?.amenities).toContain("Academia");
  });
});

