import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  selectionSession: vi.fn(),
  createSession: vi.fn(),
  rateLimit: vi.fn(),
  findLead: vi.fn(),
  findSelection: vi.fn(),
  listingDto: vi.fn((property: Record<string, unknown>) => ({
    id: property.id,
    title: property.title,
    publicAddress: property.publicAddress,
  })),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mari/db", () => ({
  db: {
    lead: { findUnique: mocks.findLead },
    selection: { findUnique: mocks.findSelection },
  },
}));
vi.mock("@/lib/mari/auth", () => ({
  selectionSession: mocks.selectionSession,
  createSession: mocks.createSession,
  requireSelectionAccess: vi.fn(),
}));
vi.mock("@/lib/mari/http", () => ({
  requestIp: () => "203.0.113.7",
  rateLimit: mocks.rateLimit,
  assert: (value: unknown, status: number, message: string) => {
    if (!value) throw Object.assign(new Error(message), { status });
  },
}));
vi.mock("@/lib/mari/catalog", () => ({
  listingInclude: {},
  listingDto: mocks.listingDto,
}));
vi.mock("@/lib/mari/client-selection", () => ({
  ensureClientSelection: vi.fn(),
}));

import {
  clientState,
  recoverSelection,
  sharedSelection,
} from "@/lib/mari/client-service";

describe("seleção pública recuperada por telefone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSession.mockResolvedValue(undefined);
  });

  it("retorna somente token e imóveis públicos, sem dados do lead", async () => {
    mocks.selectionSession.mockResolvedValue({
      leadId: "lead-1",
    });
    mocks.findSelection.mockResolvedValue({
      publicToken: "public-token",
      items: [
        {
          property: {
            id: "property-1",
            title: "Apartamento público",
            status: "published",
            publicAddress: "Centro",
            privateAddress: "ENDERECO-PRIVADO",
          },
        },
      ],
    });

    const result = await clientState();

    expect(result).toEqual({
      publicToken: "public-token",
      items: [
        {
          id: "property-1",
          title: "Apartamento público",
          publicAddress: "Centro",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("5547999991234");
    expect(JSON.stringify(result)).not.toContain("ENDERECO-PRIVADO");
  });

  it("recupera em outro dispositivo sem OTP e limita IP e telefone", async () => {
    mocks.findLead.mockResolvedValue({
      id: "lead-1",
      selection: { id: "selection-1" },
    });

    await expect(
      recoverSelection(
        { phone: "(47) 99999-1234" },
        new Request("https://mari.example/api/client/recover"),
      ),
    ).resolves.toEqual({ ok: true });

    expect(mocks.rateLimit.mock.calls).toEqual([
      ["recover:203.0.113.7", 20],
      ["recover-phone:5547999991234", 6],
    ]);
    expect(mocks.findLead).toHaveBeenCalledWith({
      where: { phone: "5547999991234" },
      select: { id: true, selection: { select: { id: true } } },
    });
    expect(mocks.createSession).toHaveBeenCalledWith("client", "lead-1");
  });

  it("não expõe o título administrativo no link compartilhado", async () => {
    mocks.findSelection.mockResolvedValue({
      title: "Nome privado da cliente",
      items: [
        {
          property: {
            id: "property-1",
            title: "Apartamento público",
            publicAddress: "Centro",
          },
        },
      ],
    });

    await expect(sharedSelection("public-token")).resolves.toEqual({
      title: "Seleção de imóveis",
      items: [
        {
          id: "property-1",
          title: "Apartamento público",
          publicAddress: "Centro",
        },
      ],
    });
  });
});
