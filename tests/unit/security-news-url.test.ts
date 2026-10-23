import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mari/db", () => ({
  db: {
    news: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
    },
  },
}));

import {
  newsBySlug,
  newsSchema,
  publicNews,
} from "@/lib/mari/news-service";

const validNews = {
  title: "Mercado imobiliário local",
  summary: "Resumo válido para a notícia local.",
  content: "",
  city: "Itajaí",
  coverImage: "",
  sourceUrl: "https://example.test/noticia",
  published: true,
  featured: false,
};

describe("URLs externas de notícias", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aceita HTTPS e rejeita protocolos inseguros na gravação", () => {
    expect(newsSchema.safeParse(validNews).success).toBe(true);
    for (const sourceUrl of [
      "javascript:alert(1)",
      "data:text/html,test",
      "ftp://example.test/noticia",
      "http://example.test/noticia",
    ])
      expect(newsSchema.safeParse({ ...validNews, sourceUrl }).success).toBe(
        false,
      );
  });

  it("neutraliza protocolos inseguros já persistidos nas leituras públicas", async () => {
    const legacy = { id: "news-1", slug: "legada", sourceUrl: "data:text/html,test" };
    mocks.findMany.mockResolvedValue([legacy]);
    mocks.findFirst.mockResolvedValue(legacy);

    await expect(publicNews()).resolves.toEqual([
      { ...legacy, sourceUrl: "" },
    ]);
    await expect(newsBySlug("legada")).resolves.toEqual({
      ...legacy,
      sourceUrl: "",
    });
  });
});
