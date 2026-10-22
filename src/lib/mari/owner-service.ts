import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { assert } from "./http";
import { phoneSchema } from "./validation";

const schema = z.object({
  firstName: z.string().trim().min(2).max(80), phone: phoneSchema,
  purpose: z.enum(["sale", "rent"]), propertyType: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(100), neighborhood: z.string().trim().min(2).max(100),
  location: z.string().trim().max(250).default(""), area: z.number().min(0).max(1000000).nullable(),
  bedrooms: z.number().int().min(0).max(100).nullable(), askingPrice: z.number().min(0).max(999999999999).nullable(),
  notes: z.string().trim().max(5000).default(""), photoIds: z.array(z.string()).max(12).default([]), consent: z.literal(true),
});

export async function saveOwnerSubmission(input: unknown) {
  const data = schema.parse(input);
  return db.$transaction(async (tx) => {
    const stage = await tx.leadStage.findFirstOrThrow({ where: { isDefault: true } });
    const lead = await tx.lead.upsert({ where: { phone: data.phone }, create: { firstName: data.firstName, phone: data.phone, source: "Captação de proprietário", consentAt: new Date(), stageId: stage.id, position: await tx.lead.count({ where: { stageId: stage.id } }) }, update: { lastActivityAt: new Date() } });
    const photos = await tx.media.findMany({ where: { id: { in: data.photoIds }, propertyId: null, ownerSubmissionId: null } });
    assert(photos.length === data.photoIds.length, 400, "Uma fotografia não está disponível.");
    const { photoIds, firstName: _name, phone: _phone, consent: _consent, ...fields } = data;
    void _name; void _phone; void _consent;
    const row = await tx.ownerSubmission.create({ data: { ...fields, leadId: lead.id } });
    if (photoIds.length) await tx.media.updateMany({ where: { id: { in: photoIds } }, data: { ownerSubmissionId: row.id } });
    return { ok: true, id: row.id };
  });
}

export async function ownerSubmissions() {
  return db.ownerSubmission.findMany({ include: { lead: { select: { firstName: true, phone: true } }, photos: true, convertedProperty: { select: { id: true, code: true, title: true } } }, orderBy: { createdAt: "desc" } });
}

export async function convertOwnerSubmission(id: string) {
  return db.$transaction(async (tx) => {
    const row = await tx.ownerSubmission.findUnique({ where: { id }, include: { photos: true } });
    assert(row, 404, "Captação não encontrada.");
    if (row.convertedPropertyId) return { id: row.convertedPropertyId };
    const code = `MARI-${randomBytes(4).toString("hex").toUpperCase()}`;
    const title = `${row.propertyType} em ${row.neighborhood}`;
    const slug = `${title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${code.toLowerCase()}`;
    const city = await tx.city.upsert({ where: { name: row.city }, update: {}, create: { id: `city-${randomBytes(8).toString("hex")}`, name: row.city } });
    const property = await tx.property.create({ data: { code, slug, title, headline: "", purpose: row.purpose, type: row.propertyType, status: "draft", price: row.askingPrice, city: row.city, cityId: city.id, neighborhood: row.neighborhood, publicAddress: row.location, privateAddress: row.location, description: row.notes.length >= 10 ? row.notes : "Imóvel recebido pela área de captação. Revise as informações antes de publicar.", bedrooms: row.bedrooms, area: row.area } });
    for (const [position, photo] of row.photos.entries()) await tx.media.update({ where: { id: photo.id }, data: { propertyId: property.id, position } });
    await tx.ownerSubmission.update({ where: { id }, data: { convertedPropertyId: property.id, status: "converted" } });
    return { id: property.id };
  });
}
