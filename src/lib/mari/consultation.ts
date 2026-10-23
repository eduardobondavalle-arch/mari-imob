import { z } from "zod";
import { db } from "./db";
import { normalizePhone, phoneSchema } from "./validation";

const answerSchema = z.object({
  objective: z.string().min(1),
  regions: z.array(z.string()).min(1),
  timing: z.string().min(1),
  bedrooms: z.string().min(1),
  budget: z.string().min(1),
  payment: z.string().min(1),
  otherBudget: z.string().max(80).optional().default(""),
});
export const consultationSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  consent: z.literal(true),
  answers: answerSchema,
});

export async function saveConsultation(input: unknown) {
  const data = consultationSchema.parse(input);
  const phone = normalizePhone(data.phone);
  return db.$transaction(async (tx) => {
    const stage = await tx.leadStage.findFirstOrThrow({ where: { isDefault: true } });
    const lead = await tx.lead.upsert({
      where: { phone },
      create: { firstName: data.firstName, phone, source: "Consultoria personalizada", qualified: true, consentAt: new Date(), stageId: stage.id, position: await tx.lead.count({ where: { stageId: stage.id } }) },
      // A public, unauthenticated submission may append a clearly unverified
      // consultation, but must not rewrite a lead that already exists.
      update: {},
    });
    await tx.consultation.create({
      data: {
        leadId: lead.id,
        answers: data.answers,
        identityVerified: false,
      },
    });
    return { ok: true, leadId: lead.id };
  });
}
