import { config } from "dotenv";
import { copyFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { defaultContent } from "../src/lib/mari/defaults";

config({ path: ".env.local", quiet: true });
const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "property-media";
if (!sourceUrl || !targetUrl || !supabaseUrl || !storageKey)
  throw new Error("Configure SOURCE_DATABASE_URL, TARGET_DATABASE_URL e Supabase.");

const source = new PrismaClient({ adapter: new PrismaPg({ connectionString: sourceUrl, max: 1 }) });
const target = new PrismaClient({ adapter: new PrismaPg({ connectionString: targetUrl, max: 1 }) });
const objectUrl = (key: string) => `${supabaseUrl}/storage/v1/object/${bucket}/${key}`;

async function upload(key: string) {
  const file = await readFile(resolve(process.env.UPLOAD_DIR || ".data/uploads", key));
  const response = await fetch(objectUrl(key), {
    method: "POST",
    headers: { apikey: storageKey!, Authorization: `Bearer ${storageKey}`, "Content-Type": "image/webp", "x-upsert": "true" },
    body: new Uint8Array(file),
  });
  if (!response.ok) throw new Error(`Falha ao enviar ${key}: ${response.status} ${await response.text()}`);
}

async function main() {
  const properties = await source.property.findMany({ where: { status: "published" }, include: { images: true, tags: true, values: { where: { field: { public: true, archived: false } } } } });
  const tags = await source.tag.findMany();
  const taxonomies = await source.taxonomy.findMany();
  const cities = await source.city.findMany();
  const fields = await source.customField.findMany({ where: { public: true, archived: false }, include: { options: true } });
  const settings = await source.siteSettings.findUnique({ where: { id: "main" } });
  const content = { ...defaultContent, ...((settings?.published as object) || {}) };
  const contentKeys = Object.values(content).filter((value): value is string => typeof value === "string" && /^\/media\/[a-zA-Z0-9-]+\.webp$/.test(value)).map((value) => value.slice(7));
  const contentMedia = await source.media.findMany({ where: { key: { in: contentKeys } } });
  const allMedia = [...new Map([...properties.flatMap((property) => property.images), ...contentMedia].map((media) => [media.id, media])).values()];
  for (const media of allMedia) await upload(media.key);
  await target.$transaction(async (tx) => {
    await tx.propertyValue.deleteMany();
    await tx.property.deleteMany();
    await tx.fieldOption.deleteMany();
    await tx.customField.deleteMany();
    await tx.tag.deleteMany();
    await tx.taxonomy.deleteMany();
    await tx.city.deleteMany();
    for (const city of cities) await tx.city.upsert({ where: { id: city.id }, create: city, update: city });
    for (const tag of tags) await tx.tag.upsert({ where: { id: tag.id }, create: tag, update: tag });
    for (const taxonomy of taxonomies) await tx.taxonomy.upsert({ where: { id: taxonomy.id }, create: taxonomy, update: taxonomy });
    for (const { options, ...field } of fields) {
      await tx.customField.upsert({ where: { id: field.id }, create: field, update: field });
      for (const option of options) await tx.fieldOption.upsert({ where: { id: option.id }, create: option, update: option });
    }
    await tx.siteSettings.update({ where: { id: "main" }, data: { published: content } });
    for (const { images: _images, tags: propertyTags, values, ...property } of properties) {
      await tx.property.create({ data: { ...property, privateAddress: "", tags: { connect: propertyTags.map((tag) => ({ id: tag.id })) } } });
      for (const value of values) await tx.propertyValue.create({ data: { ...value, value: value.value! } });
    }
    for (const media of allMedia) await tx.media.create({ data: { ...media, propertyId: properties.some((property) => property.id === media.propertyId) ? media.propertyId : null } });
  }, { timeout: 120000 });
  console.log(`Catálogo sincronizado: ${properties.length} imóveis, ${allMedia.length} imagens.`);
}

main().finally(async () => { await source.$disconnect(); await target.$disconnect(); });
