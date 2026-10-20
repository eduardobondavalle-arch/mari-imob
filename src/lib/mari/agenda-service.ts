import "server-only";
import { z } from "zod";
import { db } from "./db";
import { assert, HttpError } from "./http";
const include = {
  type: true,
  lead: { select: { id: true, firstName: true } },
  property: { select: { id: true, title: true, code: true } },
};
export async function appointments(params: URLSearchParams) {
  const from = params.get("from"),
    to = params.get("to"),
    leadId = params.get("leadId");
  assert(
    (!from || Number.isFinite(Date.parse(from))) &&
      (!to || Number.isFinite(Date.parse(to))),
    400,
    "Intervalo inválido.",
  );
  return db.appointment.findMany({
    where: {
      ...(leadId ? { leadId } : {}),
      ...(from ? { endsAt: { gt: new Date(from) } } : {}),
      ...(to ? { startsAt: { lt: new Date(to) } } : {}),
    },
    include,
    orderBy: { startsAt: "asc" },
    take: 2000,
  });
}
export async function appointmentDetail(id: string) {
  const event = await db.appointment.findUnique({ where: { id }, include });
  assert(event, 404, "Compromisso não encontrado.");
  return event;
}
export async function saveAppointment(
  input: unknown,
  authorId: string,
  id?: string,
) {
  const { allowConflict, ...data } = z
    .object({
      title: z.string().trim().min(2).max(180),
      description: z.string().trim().max(5000).default(""),
      startsAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
      endsAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
      typeId: z.string(),
      leadId: z.string().nullable().default(null),
      propertyId: z.string().nullable().default(null),
      status: z.enum(["scheduled", "cancelled"]).default("scheduled"),
      allowConflict: z.boolean().default(false),
    })
    .parse(input);
  assert(
    data.endsAt > data.startsAt,
    400,
    "O término precisa ser posterior ao início.",
  );
  return db.$transaction(
    async (tx) => {
      // Serializes every calendar write, including simultaneous confirmations.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(73002)`;
      assert(
        await tx.appointmentType.findUnique({ where: { id: data.typeId } }),
        400,
        "Tipo inválido.",
      );
      if (data.leadId)
        assert(
          await tx.lead.findUnique({ where: { id: data.leadId } }),
          400,
          "Interessado inválido.",
        );
      if (data.propertyId)
        assert(
          await tx.property.findUnique({ where: { id: data.propertyId } }),
          400,
          "Imóvel inválido.",
        );
      if (id)
        assert(
          await tx.appointment.findUnique({ where: { id } }),
          404,
          "Compromisso não encontrado.",
        );
      const conflicts =
        data.status === "cancelled"
          ? []
          : await tx.appointment.findMany({
              where: {
                ...(id ? { id: { not: id } } : {}),
                status: "scheduled",
                startsAt: { lt: data.endsAt },
                endsAt: { gt: data.startsAt },
              },
              select: { id: true, title: true, startsAt: true, endsAt: true },
            });
      if (conflicts.length && !allowConflict)
        throw new HttpError(
          409,
          "Há compromissos nesse horário. Confira antes de confirmar.",
          { conflicts },
        );
      return id
        ? tx.appointment.update({ where: { id }, data, include })
        : tx.appointment.create({ data: { ...data, authorId }, include });
    },
    { timeout: 15000 },
  );
}
