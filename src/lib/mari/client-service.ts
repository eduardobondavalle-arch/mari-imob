import "server-only";
import { z } from "zod";
import { db } from "./db";
import { assert, rateLimit, requestIp } from "./http";
import { createSession, requireClient, session } from "./auth";
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
  const auth = await session("client");
  if (!auth?.lead) return null;
  const selection = await db.selection.findUnique({
    where: { clientLeadId: auth.lead.id },
    include: {
      items: {
        include: { property: { include: listingInclude } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return {
    firstName: auth.lead.firstName,
    phone: auth.lead.phone,
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
  const current = await session("client");
  if (current?.lead) {
    await db.$transaction(async (tx) => {
      const selection = await ensureClientSelection(current.lead!.id, tx);
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
      await tx.lead.update({
        where: { id: current.lead!.id },
        data: { lastActivityAt: new Date() },
      });
    });
    return { ok: true };
  }
  const existing = await db.lead.findUnique({ where: { phone: data.phone } });
  if (existing) return { recoveryRequired: true };
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
export async function changeSelection(id: string, remove = false) {
  const lead = await requireClient();
  if (!remove) await available(id);
  await db.$transaction(async (tx) => {
    const selection = await ensureClientSelection(lead.id, tx);
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
    await tx.lead.update({
      where: { id: lead.id },
      data: { lastActivityAt: new Date() },
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
        title: selection.title,
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
  let lead = (await session("client"))?.lead;
  if (!lead) {
    const identity = identitySchema.parse(data);
    await rateLimit(`contact-phone:${identity.phone}`, 8);
    lead = await db.lead.upsert({
      where: { phone: identity.phone },
      update: { lastActivityAt: new Date() },
      create: {
        firstName: identity.firstName,
        phone: identity.phone,
        source: "solicitacao-contato",
        consentAt: new Date(),
      },
    });
  }
  await ensureClientSelection(lead.id);
  await db.$transaction([
    db.contactRequest.create({
      data: {
        leadId: lead.id,
        propertyId: data.propertyId,
        message: data.message,
      },
    }),
    db.lead.update({
      where: { id: lead.id },
      data: { lastActivityAt: new Date() },
    }),
  ]);
  return { ok: true };
}
export async function deleteAccount() {
  const lead = await requireClient();
  await db.lead.delete({ where: { id: lead.id } });
  return { ok: true };
}
