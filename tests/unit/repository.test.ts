import { describe, expect, it } from "vitest";
import { properties } from "../../src/data/properties";
import { createLocalRepository } from "../../src/data/local-repository";
import {
  asURLSearchParams,
  parseSearch,
  searchQuery,
} from "../../src/lib/search";
import { monthlyCosts, money } from "../../src/lib/format";
import { validateEnvironment } from "../../src/lib/environment";
import {
  draftMessage,
  propertyMessage,
  whatsappLink,
} from "../../src/lib/contact";
const repo = createLocalRepository(async () => properties);
const search = (query = "") =>
  repo.search(parseSearch(new URLSearchParams(query)).params);
describe("Contrato do catálogo de locação", () => {
  it("pagina após ordenar e mantém contagem do conjunto elegível", async () => {
    const a = await search("sort=price-asc"),
      b = await search("sort=price-asc&page=2");
    expect(a.total).toBe(15);
    expect(a.items).toHaveLength(6);
    expect(new Set([...a.items, ...b.items].map((p) => p.id)).size).toBe(12);
    expect(a.items.at(-1)!.costs.rent!).toBeLessThanOrEqual(
      b.items[0].costs.rent!,
    );
  });
  it("código exato encontra o mesmo registro de detalhes", async () => {
    const r = await search("q=demo003");
    expect(r.items.map((p) => p.code)).toEqual(["DEMO003"]);
    expect(await repo.getBySlug(r.items[0].slug)).toEqual(r.items[0]);
  });
  it("normaliza acentos e combina as palavras", async () => {
    const a = await search("q=Balneário Camboriú&maxRent=3000"),
      b = await search("q=balneario camboriu&maxRent=3000");
    expect(a.items.map((p) => p.id)).toEqual(b.items.map((p) => p.id));
    expect(a.items.length).toBeGreaterThan(0);
    expect(a.items.every((p) => p.costs.rent! <= 300000)).toBe(true);
  });
  it("combina cidades com OR e características com AND", async () => {
    const r = await search(
      "city=itajai&city=itapema&type=apartamento&bedrooms=2&amenities=Mobiliado&amenities=Aceita+pet",
    );
    expect(r.items.map((p) => p.code)).toEqual(["14484", "4521", "DEMO003"]);
  });
  it("filtra todas as comodidades do condomínio", async () => {
    const r = await search(
      "buildingAmenities=Piscina&buildingAmenities=Academia",
    );
    expect(
      r.items.every(
        (p) =>
          p.building?.amenities.includes("Academia") &&
          p.building?.amenities.includes("Piscina"),
      ),
    ).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });
  it("limites são inclusivos e desconhecidos não satisfazem filtro numérico", async () => {
    expect(
      (await search("minRent=5800&maxRent=5800")).items.map((p) => p.code),
    ).toEqual(["DEMO001"]);
    expect((await search("minArea=0")).total).toBe(14);
    expect((await search("maxRent=100000")).total).toBe(12);
  });
  it("preços ausentes ficam no fim das duas ordenações", async () => {
    for (const sort of ["price-asc", "price-desc"])
      expect(
        (await search(`sort=${sort}&page=3`)).items.at(-1)?.costs.rent,
      ).toBeNull();
  });
  it("não apresenta indisponível em busca/destaques/similares", async () => {
    expect((await search("q=DEMO014")).total).toBe(0);
    expect(
      (await repo.getBySlug("apartamento-pioneiros-DEMO014"))?.available,
    ).toBe(false);
    expect((await repo.getFeatured()).some((p) => p.code === "DEMO014")).toBe(
      false,
    );
    expect(
      (await repo.getSimilar("DEMO001")).every(
        (p) => p.available && p.code !== "DEMO001",
      ),
    ).toBe(true);
  });
  it("retorna vazio sem transformar em falha", async () => {
    expect((await search("q=SEMRESULTADO123")).total).toBe(0);
    expect(await repo.getBySlug("inexistente")).toBeNull();
  });
  it("mantém erro do repositório distinguível de vazio", async () => {
    const broken = createLocalRepository(async () => {
      throw new Error("Falha controlada");
    });
    await expect(
      broken.search(parseSearch(new URLSearchParams()).params),
    ).rejects.toThrow("Falha controlada");
  });
  it("resgata o código de um slug antigo", async () => {
    expect((await repo.getBySlug("titulo-antigo-DEMO001"))?.code).toBe(
      "DEMO001",
    );
  });
});
describe("URL e validação", () => {
  it("preserva arrays, texto, faixa, ordenação e página no roundtrip", () => {
    const a = parseSearch(
      new URLSearchParams(
        "city=itajai&city=itapema&q=mar&minRent=3200.50&maxArea=150&sort=recent&page=2",
      ),
    ).params;
    expect(parseSearch(new URLSearchParams(searchQuery(a))).params).toEqual(a);
  });
  it("normaliza o formato de query do Next sem perder multisseleção", () => {
    expect(
      asURLSearchParams({
        city: ["itajai", "itapema"],
        q: "mar",
        missing: undefined,
      }).getAll("city"),
    ).toEqual(["itajai", "itapema"]);
  });
  it("ignora números malformados e informa problema de faixas", () => {
    const r = parseSearch(
      new URLSearchParams(
        "page=NaN&bedrooms=-1&minRent=6000&maxRent=4000&minArea=90&maxArea=50",
      ),
    );
    expect(r.params.page).toBe(1);
    expect(r.params.bedrooms).toBeUndefined();
    expect(r.issues).toHaveLength(4);
  });
  it("ajusta página fora do conjunto filtrado", async () =>
    expect((await search("q=DEMO001&page=20")).page).toBe(1));
});
describe("Custos e contato", () => {
  it("converte IPTU anual para estimativa sem alterar o valor original", () => {
    const c = properties.find((p) => p.code === "DEMO001")!.costs;
    expect(monthlyCosts(c)).toEqual({
      total: 637000,
      complete: true,
      estimated: true,
    });
    expect(c.iptu.amount).toBe(144000);
    expect(money(580000)).toContain("5.800");
  });
  it("distingue zero, desconhecido e subtotal", () => {
    expect(
      monthlyCosts({
        rent: 100000,
        condominium: { amount: 0, period: "monthly" },
        iptu: { amount: null, period: "unknown" },
      }),
    ).toEqual({ total: 100000, complete: false, estimated: false });
    expect(money(0)).not.toBe(money(null));
  });
  it("inclui demonstração, código, título e URL na mensagem", () => {
    const p = properties.find((p) => p.isDemo)!,
      message = propertyMessage(p, "https://preview.example");
    expect(message).toContain("não é uma oferta real");
    expect(message).toContain(p.code);
    expect(message).toContain(p.title);
    expect(message).toContain(p.slug);
    expect(new URL(whatsappLink(message)).searchParams.get("text")).toBe(
      message,
    );
  });
  it("prepara retorno com um canal e preserva caracteres", () => {
    expect(
      draftMessage({
        name: " Ana ",
        email: "ana@example.com",
        phone: "",
        message: "Casa & varanda?",
      }),
    ).toBe(
      "Olá, Adim! Meu nome é Ana.\nCasa & varanda?\nRetorno: ana@example.com",
    );
  });
  it("modo demo permite build de produção sem API, live não permite fixtures", () => {
    expect(validateEnvironment({})).toEqual({ mode: "demo", source: "local" });
    expect(() => validateEnvironment({ APP_MODE: "live" })).toThrow(
      "dados demonstrativos",
    );
    expect(() => validateEnvironment({ PROPERTY_DATA_SOURCE: "api" })).toThrow(
      "adaptador",
    );
  });
});
