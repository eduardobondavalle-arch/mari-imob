import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findStage: vi.fn(),
  countLeads: vi.fn(),
  upsertLead: vi.fn(),
  createSubmission: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mari/db", () => ({
  db: {
    $transaction: async (operation: (tx: unknown) => unknown) =>
      operation({
        leadStage: { findFirstOrThrow: mocks.findStage },
        lead: { count: mocks.countLeads, upsert: mocks.upsertLead },
        ownerSubmission: { create: mocks.createSubmission },
      }),
  },
}));

import { saveOwnerSubmission } from "@/lib/mari/owner-service";

describe("integridade do lead em captações públicas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findStage.mockResolvedValue({ id: "stage-new" });
    mocks.countLeads.mockResolvedValue(4);
    mocks.upsertLead.mockResolvedValue({ id: "lead-existing" });
    mocks.createSubmission.mockResolvedValue({ id: "submission-1" });
  });

  it("registra a captação sem alterar atributos comerciais do lead existente", async () => {
    await expect(
      saveOwnerSubmission({
        firstName: "Pessoa não verificada",
        phone: "(47) 99999-1234",
        purpose: "sale",
        propertyType: "Apartamento",
        city: "Balneário Camboriú",
        neighborhood: "Centro",
        location: "Localização aproximada",
        area: 120,
        bedrooms: 3,
        askingPrice: 2500000,
        notes: "Captação pública de teste.",
        consent: true,
      }),
    ).resolves.toEqual({ ok: true, id: "submission-1" });

    expect(mocks.upsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phone: "5547999991234" },
        update: {},
      }),
    );
    expect(mocks.createSubmission).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-existing",
        propertyType: "Apartamento",
        city: "Balneário Camboriú",
      }),
    });
  });
});
