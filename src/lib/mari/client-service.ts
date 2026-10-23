import "server-only";
import { z } from "zod";
import { db } from "./db";
import { assert, rateLimit, requestIp } from "./http";
import { createSession, requireSelectionAccess, selectionSession } from "./auth";
import { identitySchema } from "./validation";
import { listingDto, listingInclude } from "./catalog";
import { ensureClientSelection } from "./client-selection";
async function available(id?: string) {
  if (id)
    assert(
      await db.property.findFirst({ where: { id, status: "published" } }),
      404,
      "Este imóvel não está mais disponível.",
    );
}
export async function clientState() {
  const auth = await selectionSession();
  if (!auth?.leadId) return null;
  const selection = await db.selection.findUnique({
    where: { clientLeadId: auth.leadId },
    include: {
      items: {
        include: { property: { include: listingInclude } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return {
    publicToken: selection?.publicToken || "",
    items:
      selection?.items
        .filter((i) => i.property.status === "published")
        .map((i) => listingDto(i.property)) || [],
  };
}
export async function registerSelection(input: unknown, request: Request) {
  const data = identitySchema.parse(input);
  await rateLimit(`register:${requestIp(request)}`, 20);
  await rateLimit(`register-phone:${data.phone}`, 6);
  await available(data.propertyId);
  const current = await selectionSession();
  if (current?.leadId) {
    await db.$transaction(async (tx) => {
      const selection = await ensureClientSelection(current.leadId!, tx);
      if (data.propertyId)
        await tx.selectionItem.upsert({
          where: {
            selectionId_propertyId: {
              selectionId: selection.id,
              propertyId: data.propertyId,
            },
          },
          update: {},
          create: { selectionId: selection.id, propertyId: data.propertyId },
        });
    });
    return { ok: true };
  }
  const existing = await db.lead.findUnique({ where: { phone: data.phone } });
  if (existing) {
    await db.$transaction(async (tx) => {
      const selection = await ensureClientSelection(existing.id, tx);
      if (data.propertyId)
        await tx.selectionItem.upsert({
          where: {
            selectionId_propertyId: {
              selectionId: selection.id,
              propertyId: data.propertyId,
            },
          },
          update: {},
          create: { selectionId: selection.id, propertyId: data.propertyId },
        });
    });
    await createSession("client", existing.id);
    return { ok: true, recovered: true };
  }
  const lead = await db.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        firstName: data.firstName,
        phone: data.phone,
        source: "minha-selecao",
        consentAt: new Date(),
      },
    });
    const selection = await ensureClientSelection(created.id, tx);
    if (data.propertyId)
      await tx.selectionItem.create({
        data: { selectionId: selection.id, propertyId: data.propertyId },
      });
    return created;
  });
  await createSession("client", lead.id);
  return { ok: true };
}
export async function recoverSelection(input: unknown, request: Request) {
  const data = z.object({ phone: identitySchema.shape.phone }).parse(input);
  await rateLimit(`recover:${requestIp(request)}`, 20);
  await rateLimit(`recover-phone:${data.phone}`, 6);
  const lead = await db.lead.findUnique({
    where: { phone: data.phone },
    select: { id: true, selection: { select: { id: true } } },
  });
  assert(lead?.selection, 404, "Nenhuma seleção foi encontrada para este telefone.");
  await createSession("client", lead.id);
  return { ok: true };
}
export async function changeSelection(id: string, remove = false) {
  const access = await requireSelectionAccess();
  if (!remove) await available(id);
  await db.$transaction(async (tx) => {
    const selection = await ensureClientSelection(access.leadId, tx);
    if (remove)
      await tx.selectionItem.deleteMany({
        where: { selectionId: selection.id, propertyId: id },
      });
    else
      await tx.selectionItem.upsert({
        where: {
          selectionId_propertyId: { selectionId: selection.id, propertyId: id },
        },
        update: {},
        create: { selectionId: selection.id, propertyId: id },
      });
  });
  return { ok: true };
}
export async function sharedSelection(publicToken: string) {
  const selection = await db.selection.findUnique({
    where: { publicToken },
    include: {
      items: {
        where: { property: { status: "published" } },
        include: { property: { include: listingInclude } },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  return selection
    ? {
        title: "Seleção de imóveis",
        items: selection.items.map((item) => listingDto(item.property)),
      }
    : null;
}
export async function contactRequest(input: unknown, request: Request) {
  await rateLimit(`contact:${requestIp(request)}`, 20);
  const data = z
    .object({
      firstName: z.string().optional(),
      phone: z.string().optional(),
      consent: z.boolean(),
      propertyId: z.string().max(100).optional(),
      message: z.string().trim().max(3000).default(""),
    })
    .parse(input);
  assert(data.consent, 400, "Confirme a solicitação de contato.");
  await available(data.propertyId);
  // A convenience selection session is not proof of identity and therefore
  // never authorizes a CRM action. Contact submissions validate their own
  // public-form identity and consent every time.
  const identity = identitySchema.parse(data);
  await rateLimit(`contact-phone:${identity.phone}`, 8);
  const lead = await db.lead.upsert({
    where: { phone: identity.phone },
    update: {},
    create: {
      firstName: identity.firstName,
      phone: identity.phone,
      source: "solicitacao-contato",
      consentAt: new Date(),
    },
  });
  await ensureClientSelection(lead.id);
  await db.contactRequest.create({
    data: {
      leadId: lead.id,
      propertyId: data.propertyId,
      message: data.message,
    },
  });
  return { ok: true };
}
