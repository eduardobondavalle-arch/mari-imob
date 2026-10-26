import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { assert } from "./http";
import { propertySchema, fieldSchema, contentSchema } from "./validation";
import { listingDto, listingInclude } from "./catalog";
import { defaultContent } from "./defaults";
export async function saveProperty(input: unknown, id?: string) {
  const data = propertySchema.parse(input);
  const offers = data.offers?.length
    ? data.offers
    : [{ purpose: data.purpose, price: data.price, active: true }];
  assert(
    new Set(offers.map((offer) => offer.purpose)).size === offers.length,
    400,
    "Não repita uma finalidade.",
  );
  assert(
    new Set(data.imageIds).size === data.imageIds.length,
    400,
    "Remova imagens repetidas.",
  );
  const fields = await db.customField.findMany({
    where: { archived: false },
    include: { options: true },
  });
  const values: { fieldId: string; value: Prisma.InputJsonValue }[] = [];
  for (const field of fields) {
    const value = data.customValues[field.id];
    const empty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && !value.length);
    assert(!field.required || !empty, 400, `Preencha o campo ${field.label}.`);
    if (empty) continue;
    if (["number", "money"].includes(field.type))
      assert(
        typeof value === "number" && Number.isFinite(value),
        400,
        `${field.label}: informe um número.`,
      );
    else if (field.type === "boolean")
      assert(
        typeof value === "boolean",
        400,
        `${field.label}: escolha sim ou não.`,
      );
    else if (field.type === "multiselect")
      assert(
        Array.isArray(value) &&
          value.every((v) => field.options.some((o) => o.value === v)),
        400,
        `${field.label}: opção inválida.`,
      );
    else {
      assert(
        typeof value === "string",
        400,
        `${field.label}: informe um texto.`,
      );
      if (field.type === "select")
        assert(
          field.options.some((o) => o.value === value),
          400,
          `${field.label}: opção inválida.`,
        );
      if (field.type === "date")
        assert(
          /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
          400,
          `${field.label}: data inválida.`,
        );
    }
    values.push({ fieldId: field.id, value: value as Prisma.InputJsonValue });
  }
  for (const [kind, taxonomyId] of [
    ["category", data.categoryId],
    ["situation", data.situationId],
  ])
    if (taxonomyId)
      assert(
        await db.taxonomy.findFirst({ where: { id: taxonomyId, kind: kind! } }),
        400,
        "Categoria ou situação inválida.",
      );
  const {
    imageIds,
    tagIds,
    customValues: _customValues,
    offers: _offers,
    ...propertyData
  } = data;
  const primaryOffer = offers.find((offer) => offer.active) || offers[0];
  void _offers;
  propertyData.purpose = primaryOffer.purpose;
  propertyData.price = primaryOffer.price;
  const municipality = await db.city.findFirst({
    where: { name: { equals: data.city, mode: "insensitive" } },
  });
  const cityId =
    municipality?.id ||
    (
      await db.city.upsert({
        where: { name: data.city },
        update: {},
        create: {
          id: `city-${randomBytes(8).toString("hex")}`,
          name: data.city,
        },
      })
    ).id;
  void _customValues;
  return db.$transaction(
    async (tx) => {
      const existing = id
        ? await tx.property.findUnique({ where: { id } })
        : null;
      assert(!id || existing, 404, "Imóvel não encontrado.");
      const images = await tx.media.findMany({
        where: { id: { in: imageIds } },
      });
      assert(
        images.length === imageIds.length &&
          images.every((i) => !i.propertyId || i.propertyId === id),
        400,
        "Uma imagem não está disponível para este imóvel.",
      );
      const code =
        existing?.code ||
        `MARI-${randomBytes(4).toString("hex").toUpperCase()}`;
      const slug =
        existing?.slug ||
        `${data.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 100)}-${code.toLowerCase()}`;
      const relationData = {
        ...propertyData,
        cityId,
        tags: { set: tagIds.map((id) => ({ id })) },
      };
      const row = existing
        ? await tx.property.update({ where: { id }, data: relationData })
        : await tx.property.create({
            data: {
              ...propertyData,
              cityId,
              code,
              slug,
              tags: { connect: tagIds.map((id) => ({ id })) },
            },
          });
      await tx.media.updateMany({
        where: { propertyId: row.id, id: { notIn: imageIds } },
        data: { propertyId: null },
      });
      for (const [position, imageId] of imageIds.entries())
        await tx.media.update({
          where: { id: imageId },
          data: { propertyId: row.id, position },
        });
      await tx.propertyOffer.deleteMany({
        where: {
          propertyId: row.id,
          purpose: { notIn: offers.map((offer) => offer.purpose) },
        },
      });
      for (const offer of offers)
        await tx.propertyOffer.upsert({
          where: {
            propertyId_purpose: {
              propertyId: row.id,
              purpose: offer.purpose,
            },
          },
          update: { price: offer.price, active: offer.active },
          create: {
            propertyId: row.id,
            purpose: offer.purpose,
            price: offer.price,
            active: offer.active,
          },
        });
      await tx.propertyValue.deleteMany({
        where: { propertyId: row.id, fieldId: { in: fields.map((f) => f.id) } },
      });
      if (values.length)
        await tx.propertyValue.createMany({
          data: values.map((value) => ({ ...value, propertyId: row.id })),
        });
      return { id: row.id, slug: row.slug };
    },
    { timeout: 20000 },
  );
}
export async function saveField(input: unknown, id?: string) {
  const data = fieldSchema.parse(input);
  assert(
    new Set(data.options).size === data.options.length,
    400,
    "As opções não podem se repetir.",
  );
  const previous = id
    ? await db.customField.findUnique({
        where: { id },
        include: { values: true, options: true },
      })
    : null;
  assert(!id || previous, 404, "Campo não encontrado.");
  if (previous?.values.length) {
    assert(
      previous.type === data.type,
      409,
      "Este campo já contém dados. Crie outro campo para mudar o tipo.",
    );
    for (const item of previous.values)
      for (const option of Array.isArray(item.value)
        ? item.value
        : [item.value])
        if (["select", "multiselect"].includes(previous.type))
          assert(
            data.options.includes(String(option)),
            409,
            "Não remova opções utilizadas em imóveis. Arquive o campo para preservar os dados.",
          );
  }
  const { options, ...fields } = data;
  return db.$transaction(async (tx) => {
    const row = id
      ? await tx.customField.update({ where: { id }, data: fields })
      : await tx.customField.create({ data: fields });
    await tx.fieldOption.deleteMany({
      where: { fieldId: row.id, value: { notIn: options } },
    });
    for (const value of options)
      await tx.fieldOption.upsert({
        where: { fieldId_value: { fieldId: row.id, value } },
        update: {},
        create: { fieldId: row.id, value },
      });
    return row;
  });
}
export async function settingsData() {
  const [fields, tags, taxonomies, content] = await Promise.all([
    db.customField.findMany({
      where: { archived: false },
      include: { options: true },
      orderBy: { createdAt: "asc" },
    }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.taxonomy.findMany({ orderBy: { name: "asc" } }),
    db.siteSettings.findUnique({ where: { id: "main" } }),
  ]);
  return {
    fields,
    tags,
    taxonomies,
    content: content || { published: defaultContent, draft: null, revision: 0 },
  };
}
export async function saveContent(input: unknown) {
  const { action, content, revision } = z
    .object({
      action: z.enum(["draft", "publish", "discard"]),
      content: contentSchema.optional(),
      revision: z.number().int().min(0),
    })
    .parse(input);
  assert(action === "discard" || content, 400, "Conteúdo ausente.");
  const row = await db.siteSettings.updateMany({
    where: { id: "main", revision },
    data: {
      revision: { increment: 1 },
      ...(action === "publish"
        ? { published: content!, draft: Prisma.DbNull }
        : action === "discard"
          ? { draft: Prisma.DbNull }
          : { draft: content! }),
    },
  });
  assert(
    row.count,
    409,
    "O conteúdo mudou em outra janela. Recarregue antes de salvar.",
  );
  return { ok: true, revision: revision + 1 };
}
export async function dashboard() {
  const [total, published, featured, leads, newLeads, latest] =
    await Promise.all([
      db.property.count(),
      db.property.count({ where: { status: "published" } }),
      db.property.count({ where: { status: "published", featured: true } }),
      db.lead.count(),
      db.lead.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
      db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, createdAt: true, source: true },
      }),
    ]);
  return { total, published, featured, leads, newLeads, latest };
}
export async function adminProperties(q: string, status: string) {
  return (
    await db.property.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      take: 300,
    })
  ).map((p) => listingDto(p, true));
}
export async function leadList(q: string) {
  return db.lead.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
          ],
        }
      : {},
    include: {
      selection: { include: { _count: { select: { items: true } } } },
      _count: { select: { requests: true } },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 300,
  });
}
export async function leadDetail(id: string) {
  const row = await db.lead.findUnique({
    where: { id },
    include: {
      selection: {
        include: {
          items: { include: { property: { include: listingInclude } } },
        },
      },
      requests: {
        include: {
          property: { select: { title: true, code: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  assert(row, 404, "Interessado não encontrado.");
  return {
    ...row,
    selection: undefined,
    items:
      row.selection?.items.map((item) => listingDto(item.property, true)) || [],
  };
}
