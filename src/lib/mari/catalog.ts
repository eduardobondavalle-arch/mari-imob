import "server-only";
import { cache } from "react";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import type { Field, Listing, SiteContent } from "./types";
import { catalogWhere } from "./search-filters";
import { defaultContent } from "./defaults";
export const listingInclude = {
  images: { orderBy: { position: "asc" as const } },
  tags: true,
  category: true,
  situation: true,
  values: { include: { field: { include: { options: true } } } },
} satisfies Prisma.PropertyInclude;
type DbListing = Prisma.PropertyGetPayload<{ include: typeof listingInclude }>;
export function listingDto(row: DbListing, admin = false): Listing {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    headline: row.headline,
    purpose: row.purpose,
    type: row.type,
    status: row.status,
    featured: row.featured,
    superFeatured: row.superFeatured,
    price: row.price === null ? null : Number(row.price),
    condominiumFee:
      row.condominiumFee === null ? null : Number(row.condominiumFee),
    condominiumPeriod: row.condominiumPeriod,
    iptuFee: row.iptuFee === null ? null : Number(row.iptuFee),
    iptuPeriod: row.iptuPeriod,
    trashFee: row.trashFee === null ? null : Number(row.trashFee),
    trashPeriod: row.trashPeriod,
    otherFees: row.otherFees === null ? null : Number(row.otherFees),
    otherFeesPeriod: row.otherFeesPeriod,
    otherFeesDescription: row.otherFeesDescription,
    city: row.city,
    cityId: row.cityId,
    neighborhood: row.neighborhood,
    publicAddress: row.publicAddress,
    ...(admin ? { privateAddress: row.privateAddress } : {}),
    description: row.description,
    videoUrl: row.videoUrl,
    bedrooms: row.bedrooms,
    suites: row.suites,
    bathrooms: row.bathrooms,
    parking: row.parking,
    area: row.area,
    categoryId: row.categoryId,
    situationId: row.situationId,
    category: row.category,
    situation: row.situation,
    images: row.images.map(({ id, key, alt, width, height, position }) => ({
      id,
      key,
      alt,
      width,
      height,
      position,
    })),
    tags: row.tags,
    values: row.values
      .filter((v) => admin || (v.field.public && !v.field.archived))
      .map((v) => ({
        fieldId: v.fieldId,
        value: v.value,
        field: { ...v.field, type: v.field.type as Field["type"] },
      })),
  };
}
export const getContent = cache(async function getContent() {
  const settings = await db.siteSettings.findUnique({ where: { id: "main" } });
  return {
    ...defaultContent,
    ...((settings?.published as Partial<SiteContent>) || {}),
  };
});
export async function publicFields() {
  return (await db.customField.findMany({
    where: { public: true, filterable: true, archived: false },
    include: { options: true },
    orderBy: { createdAt: "asc" },
  })) as Field[];
}
export async function homeSuperFeatured() {
  const rows = await db.property.findMany({
    where: {
      status: "published",
      purpose: { in: ["sale", "rent"] },
      superFeatured: true,
    },
    include: listingInclude,
    orderBy: { updatedAt: "desc" },
    take: 3,
  });
  return rows.map((row) => listingDto(row));
}
export async function homeFeatured() {
  const rows = await db.property.findMany({
    where: {
      status: "published",
      purpose: { in: ["sale", "rent"] },
      featured: true,
    },
    include: listingInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 6,
  });
  return rows.map((row) => listingDto(row));
}
export async function searchCatalog(params: URLSearchParams) {
  const fields = await publicFields();
  const where = catalogWhere(params, fields);
  const totalPromise = db.property.count({ where });
  const locationsPromise = db.property.findMany({
    where: { status: "published", purpose: { in: ["sale", "rent"] } },
    select: { city: true, cityId: true, neighborhood: true, type: true },
    distinct: ["city", "neighborhood", "type"],
  });
  const tagsPromise = db.tag.findMany({ orderBy: { name: "asc" } });
  const citiesPromise = db.city.findMany({ orderBy: { name: "asc" } });
  const taxonomiesPromise = db.taxonomy.findMany({ orderBy: { name: "asc" } });
  const total = await totalPromise;
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number(params.get("page"));
  const page = Math.min(
    pages,
    Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1),
  );
  const sort = params.get("sort");
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ price: { sort: "asc", nulls: "last" } }, { id: "asc" }]
      : sort === "price-desc"
        ? [{ price: { sort: "desc", nulls: "last" } }, { id: "asc" }]
        : [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }];
  const itemsPromise = db.property.findMany({
    where,
    include: listingInclude,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const [items, locations, tags, cities, taxonomies] = await Promise.all([
    itemsPromise,
    locationsPromise,
    tagsPromise,
    citiesPromise,
    taxonomiesPromise,
  ]);
  return {
    items: items.map((row) => listingDto(row)),
    total,
    page,
    pages,
    fields,
    locations,
    tags,
    cities,
    taxonomies,
  };
}
export const getListing = cache(async function getListing(slug: string) {
  const row = await db.property.findFirst({
    where: { slug, status: "published", purpose: { in: ["sale", "rent"] } },
    include: listingInclude,
  });
  return row ? listingDto(row) : null;
});
