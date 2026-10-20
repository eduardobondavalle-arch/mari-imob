import "server-only";
import { z } from "zod";
import { db } from "./db";
import { assert } from "./http";
import { phoneSchema } from "./validation";
import { ensureClientSelection } from "./client-selection";
import { listingInclude, listingDto } from "./catalog";

const name = z.string().trim().min(2).max(80);
export async function board(q = "") {
  return db.leadStage.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: {
      leads: {
        where: q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q.replace(/\D/g, "") || q } },
              ],
            }
          : {},
        orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        include: {
          selections: { select: { items: { select: { propertyId: true } } } },
          appointments: {
            where: { status: "scheduled", endsAt: { gte: new Date() } },
            orderBy: { startsAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });
}
export async function saveStage(input: unknown, id?: string) {
  const data = z.object({ name }).parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73001)`;
    return id
      ? tx.leadStage.update({ where: { id }, data })
      : tx.leadStage.create({
          data: { ...data, position: await tx.leadStage.count() },
        });
  });
}
export async function reorderStages(input: unknown) {
  const ids = z.object({ ids: z.array(z.string()).max(100) }).parse(input).ids;
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73001)`;
    const all = await tx.leadStage.findMany();
    assert(
      ids.length === all.length &&
        new Set(ids).size === ids.length &&
        all.every((s) => ids.includes(s.id)),
      400,
      "Informe todas as colunas sem repetições.",
    );
    for (const [position, id] of ids.entries())
      await tx.leadStage.update({ where: { id }, data: { position } });
    return { ok: true };
  });
}
export async function deleteStage(id: string, input: unknown) {
  const { destinationId } = z
    .object({ destinationId: z.string().optional() })
    .parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73001)`;
    const stage = await tx.leadStage.findUnique({
      where: { id },
      include: { _count: { select: { leads: true } } },
    });
    assert(stage, 404, "Coluna não encontrada.");
    assert(
      !stage.isDefault && (await tx.leadStage.count()) > 1,
      409,
      "A coluna inicial precisa ser preservada para novos cadastros.",
    );
    if (stage._count.leads) {
      assert(
        destinationId &&
          destinationId !== id &&
          (await tx.leadStage.findUnique({ where: { id: destinationId } })),
        409,
        "Escolha uma coluna de destino para os interessados.",
      );
      const offset = await tx.lead.count({ where: { stageId: destinationId } });
      const leads = await tx.lead.findMany({
        where: { stageId: id },
        orderBy: { position: "asc" },
      });
      for (const [index, lead] of leads.entries())
        await tx.lead.update({
          where: { id: lead.id },
          data: { stageId: destinationId, position: offset + index },
        });
    }
    await tx.leadStage.delete({ where: { id } });
    return { ok: true };
  });
}
export async function moveLead(input: unknown) {
  const { leadId, stageId, beforeId } = z
    .object({
      leadId: z.string(),
      stageId: z.string(),
      beforeId: z.string().nullable().default(null),
    })
    .parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73001)`;
    assert(
      await tx.leadStage.findUnique({ where: { id: stageId } }),
      404,
      "Coluna não encontrada.",
    );
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    assert(lead, 404, "Interessado não encontrado.");
    const rows = await tx.lead.findMany({
      where: { stageId, id: { not: leadId } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    const index = beforeId
      ? rows.findIndex((l) => l.id === beforeId)
      : rows.length;
    assert(index >= 0, 409, "O quadro mudou. Atualize antes de mover.");
    rows.splice(index, 0, lead);
    for (const [position, row] of rows.entries())
      await tx.lead.update({
        where: { id: row.id },
        data: { stageId, position },
      });
    return { ok: true };
  });
}
export async function manualLead(input: unknown, authorId: string) {
  const data = z
    .object({
      firstName: name,
      phone: phoneSchema,
      notes: z.string().trim().max(5000).default(""),
    })
    .parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73001)`;
    const existing = await tx.lead.findUnique({ where: { phone: data.phone } });
    if (existing) return { id: existing.id, existing: true };
    const stage = await tx.leadStage.findFirstOrThrow({
      where: { isDefault: true },
    });
    const lead = await tx.lead.create({
      data: {
        firstName: data.firstName,
        phone: data.phone,
        source: "Cadastro manual",
        stageId: stage.id,
        position: await tx.lead.count({ where: { stageId: stage.id } }),
      },
    });
    await ensureClientSelection(lead.id, tx);
    if (data.notes)
      await tx.leadComment.create({
        data: { text: data.notes, leadId: lead.id, authorId },
      });
    return { id: lead.id, existing: false };
  });
}
export async function leadExtras(leadId: string) {
  assert(
    await db.lead.findUnique({ where: { id: leadId } }),
    404,
    "Interessado não encontrado.",
  );
  const comments = await db.leadComment.findMany({
    where: { leadId },
    include: { author: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });
  const selections = await db.selection.findMany({
    where: { leadId },
    include: {
      items: {
        include: { property: { include: listingInclude } },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return {
    comments,
    selections: selections.map((s) => ({
      ...s,
      items: s.items.map((i) => listingDto(i.property, true)),
    })),
  };
}
export async function saveComment(
  input: unknown,
  authorId: string,
  id?: string,
) {
  const data = z
    .object({ leadId: z.string(), text: z.string().trim().min(1).max(5000) })
    .parse(input);
  if (id) {
    const previous = await db.leadComment.findUnique({ where: { id } });
    assert(
      previous && previous.leadId === data.leadId,
      404,
      "Comentário não encontrado.",
    );
    assert(
      previous.authorId === authorId,
      403,
      "Somente o autor pode editar o comentário.",
    );
    return db.leadComment.update({ where: { id }, data: { text: data.text } });
  }
  return db.leadComment.create({ data: { ...data, authorId } });
}
export async function saveAdminSelection(input: unknown, id?: string) {
  const data = z
    .object({
      leadId: z.string(),
      title: name,
      propertyIds: z.array(z.string()).max(100),
      revision: z.number().int().min(0).default(0),
    })
    .parse(input);
  assert(
    new Set(data.propertyIds).size === data.propertyIds.length,
    400,
    "Remova imóveis repetidos.",
  );
  return db.$transaction(async (tx) => {
    assert(
      await tx.lead.findUnique({ where: { id: data.leadId } }),
      404,
      "Interessado não encontrado.",
    );
    assert(
      (await tx.property.count({
        where: { id: { in: data.propertyIds }, status: "published" },
      })) === data.propertyIds.length,
      400,
      "Selecione apenas imóveis publicados e disponíveis.",
    );
    if (id) {
      const changed = await tx.selection.updateMany({
        where: {
          id,
          leadId: data.leadId,
          origin: "admin",
          revision: data.revision,
        },
        data: { title: data.title, revision: { increment: 1 } },
      });
      assert(
        changed.count,
        409,
        "A seleção mudou ou pertence ao cliente. Reabra antes de editar.",
      );
    }
    const selection = id
      ? await tx.selection.findUniqueOrThrow({ where: { id } })
      : await tx.selection.create({
          data: { leadId: data.leadId, title: data.title, origin: "admin" },
        });
    await tx.selectionItem.deleteMany({ where: { selectionId: selection.id } });
    if (data.propertyIds.length)
      await tx.selectionItem.createMany({
        data: data.propertyIds.map((propertyId, position) => ({
          selectionId: selection.id,
          propertyId,
          position,
        })),
      });
    return selection;
  });
}
