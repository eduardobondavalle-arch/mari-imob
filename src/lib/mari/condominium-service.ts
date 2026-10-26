import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { assert } from "./http";
import { condominiumSchema } from "./validation";

export function normalizeCondominiumName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const include = {
  images: { orderBy: { position: "asc" as const } },
  _count: { select: { properties: true } },
} satisfies Prisma.CondominiumInclude;

function dto(row: Prisma.CondominiumGetPayload<{ include: typeof include }>) {
  return {
    ...row,
    amenities: Array.isArray(row.amenities) ? row.amenities as string[] : [],
    propertyCount: row._count.properties,
    _count: undefined,
  };
}

export async function condominiums(params: URLSearchParams) {
  const q = params.get("q")?.trim().slice(0, 140) || "";
  const city = params.get("city")?.trim().slice(0, 100) || "";
  const neighborhood = params.get("neighborhood")?.trim().slice(0, 100) || "";
  const rows = await db.condominium.findMany({
    where: {
      archived: params.get("archived") === "true" ? undefined : false,
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(neighborhood ? { neighborhood: { equals: neighborhood, mode: "insensitive" } } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { normalizedName: { contains: normalizeCondominiumName(q) } },
        { street: { contains: q, mode: "insensitive" } },
      ] } : {}),
    },
    include,
    orderBy: [{ archived: "asc" }, { name: "asc" }],
    take: 300,
  });
  return rows.map(dto);
}

export async function saveCondominium(input: unknown, id?: string) {
  const data = condominiumSchema.parse(input);
  assert(new Set(data.imageIds).size === data.imageIds.length, 400, "Remova imagens repetidas.");
  const normalizedName = normalizeCondominiumName(data.name);
  return db.$transaction(async (tx) => {
    const existing = id ? await tx.condominium.findUnique({ where: { id } }) : null;
    assert(!id || existing, 404, "Condomínio não encontrado.");
    const images = await tx.media.findMany({ where: { id: { in: data.imageIds } } });
    assert(
      images.length === data.imageIds.length && images.every((image) =>
        (!image.propertyId && !image.ownerSubmissionId && (!image.condominiumId || image.condominiumId === id))),
      400,
      "Uma imagem não está disponível para este condomínio.",
    );
    const rowData = {
      name: data.name,
      normalizedName,
      city: data.city,
      neighborhood: data.neighborhood,
      street: data.street,
      number: data.number,
      complement: data.complement,
      postalCode: data.postalCode.replace(/\D/g, ""),
      description: data.description,
      amenities: data.amenities,
      archived: data.archived,
    };
    const row = existing
      ? await tx.condominium.update({ where: { id }, data: rowData })
      : await tx.condominium.create({ data: rowData });
    await tx.media.updateMany({
      where: { condominiumId: row.id, id: { notIn: data.imageIds } },
      data: { condominiumId: null, position: 0 },
    });
    for (const [position, imageId] of data.imageIds.entries())
      await tx.media.update({ where: { id: imageId }, data: { condominiumId: row.id, position } });
    return dto(await tx.condominium.findUniqueOrThrow({ where: { id: row.id }, include }));
  }, { timeout: 20000 });
}

export async function archiveCondominium(id: string, unlink = false) {
  const row = await db.condominium.findUnique({ where: { id }, include: { _count: { select: { properties: true } } } });
  assert(row, 404, "Condomínio não encontrado.");
  if (row._count.properties && !unlink)
    assert(false, 409, "Este condomínio possui imóveis. Confirme o arquivamento e a desvinculação.");
  return db.$transaction(async (tx) => {
    if (unlink) await tx.property.updateMany({ where: { condominiumId: id }, data: { condominiumId: null } });
    return tx.condominium.update({ where: { id }, data: { archived: true } });
  });
}
