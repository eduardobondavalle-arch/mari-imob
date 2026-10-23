import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findStage: vi.fn(),
  countLeads: vi.fn(),
  upsertLead: vi.fn(),
  createConsultation: vi.fn(),
}));

vi.mock("@/lib/mari/db", () => ({
  db: {
    $transaction: async (operation: (tx: unknown) => unknown) =>
      operation({
        leadStage: { findFirstOrThrow: mocks.findStage },
        lead: { count: mocks.countLeads, upsert: mocks.upsertLead },
        consultation: { create: mocks.createConsultation },
      }),
  },
}));

import {
  consultationSchema,
  saveConsultation,
} from "@/lib/mari/consultation";

const answers = {
  objective: "Comprar para morar",
  regions: ["Praia Brava"],
  timing: "Agora",
  bedrooms: "3 dormitórios",
  budget: "R$ 2 milhões",
  payment: "À vista",
};

describe("consultoria pública", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findStage.mockResolvedValue({ id: "stage-new" });
    mocks.countLeads.mockResolvedValue(0);
    mocks.upsertLead.mockResolvedValue({ id: "lead-existing" });
    mocks.createConsultation.mockResolvedValue({ id: "consultation-1" });
  });

  it("normaliza o telefone usado pelo limite e pela persistência", () => {
    expect(
      consultationSchema.parse({
        firstName: "Maria",
        phone: "(47) 99999-1234",
        consent: true,
        answers,
      }).phone,
    ).toBe("5547999991234");
  });

  it("registra a submissão como não verificada sem alterar um lead preexistente", async () => {
    await saveConsultation({
      firstName: "Pessoa não verificada",
      phone: "(47) 99999-1234",
      consent: true,
      answers,
    });

    expect(mocks.upsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phone: "5547999991234" },
        update: {},
      }),
    );
    expect(mocks.createConsultation).toHaveBeenCalledWith({
      data: {
        leadId: "lead-existing",
        answers: expect.any(Object),
        identityVerified: false,
      },
    });
  });
});
