import type { Prisma } from "@/generated/prisma/client";
import type { Field } from "./types";
export function catalogWhere(
  params: URLSearchParams,
  fields: Field[],
): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [
    { status: "published" },
    { offers: { some: { active: true } } },
  ];
  const purpose = params.get("purpose");
  for (const key of [
    "purpose",
    "cityId",
    "city",
    "neighborhood",
    "type",
    "categoryId",
    "situationId",
  ] as const) {
    if (key === "city" && params.get("cityId")) continue;
    const value = params.get(key)?.slice(0, 100);
    if (key === "purpose") {
      if (["sale", "rent", "season"].includes(value || ""))
        and.push({ offers: { some: { purpose: value, active: true } } });
      continue;
    }
    if (value) and.push({ [key]: value });
  }
  if (params.get("q"))
    and.push({
      OR: ["title", "code", "city", "neighborhood"].map((key) => ({
        [key]: {
          contains: params.get("q")!.slice(0, 150),
          mode: "insensitive",
        },
      })),
    });
  const price: { gte?: number; lte?: number } = {};
  for (const [param, op] of [["minPrice", "gte"], ["maxPrice", "lte"]] as const) {
    const raw = params.get(param);
    if (raw && Number.isFinite(Number(raw)) && Number(raw) >= 0) price[op] = Number(raw);
  }
  if (Object.keys(price).length)
    and.push({ offers: { some: { active: true, ...(purpose && ["sale", "rent", "season"].includes(purpose) ? { purpose } : {}), price } } });
  for (const [param, field, op] of [
    ["minArea", "area", "gte"],
    ["maxArea", "area", "lte"],
    ["bedrooms", "bedrooms", "gte"],
    ["suites", "suites", "gte"],
    ["bathrooms", "bathrooms", "gte"],
    ["parking", "parking", "gte"],
  ] as const) {
    const raw = params.get(param);
    if (raw && Number.isFinite(Number(raw)) && Number(raw) >= 0)
      and.push({ [field]: { [op]: Number(raw) } });
  }
  if (params.get("featured") === "true") and.push({ featured: true });
  for (const id of params.getAll("tag").filter(Boolean))
    and.push({ tags: { some: { id } } });
  for (const field of fields.filter(
    (f) => f.public && f.filterable && !f.archived,
  )) {
    const key = `field_${field.id}`,
      raw = params.get(key);
    if (["number", "money"].includes(field.type)) {
      for (const [suffix, op] of [
        ["min", "gte"],
        ["max", "lte"],
      ] as const) {
        const value = params.get(`${key}_${suffix}`);
        if (value && Number.isFinite(Number(value)))
          and.push({
            values: {
              some: { fieldId: field.id, value: { [op]: Number(value) } },
            },
          });
      }
    }
    if (!raw) continue;
    if (field.type === "multiselect") {
      const values = params
        .getAll(key)
        .filter((v) => field.options.some((o) => o.value === v));
      if (values.length)
        and.push({
          OR: values.map((value) => ({
            values: {
              some: { fieldId: field.id, value: { array_contains: [value] } },
            },
          })),
        });
      continue;
    }
    if (field.type === "boolean" && !["true", "false"].includes(raw)) continue;
    if (
      ["number", "money"].includes(field.type) &&
      !Number.isFinite(Number(raw))
    )
      continue;
    const value =
      field.type === "boolean"
        ? raw === "true"
        : ["number", "money"].includes(field.type)
          ? Number(raw)
          : raw.slice(0, 500);
    and.push({
      values: {
        some: {
          fieldId: field.id,
          value: ["text", "textarea"].includes(field.type)
            ? { path: [], string_contains: String(value), mode: "insensitive" }
            : { equals: value },
        },
      },
    });
  }
  return { AND: and };
}
