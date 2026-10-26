import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/mari/crypto";
import { defaultContent } from "../src/lib/mari/defaults";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  config({ path: ".env.local", quiet: true });
  const demoRoot = resolve(".data/presentation");
  const uploads = resolve(demoRoot, "uploads");
  const sourceUrl = process.env.DATABASE_URL!;
  const demoUrl = "postgresql://postgres:postgres@127.0.0.1:54330/postgres";
  if (!sourceUrl || new URL(sourceUrl).port === "54330")
    throw new Error(
      "A origem deve ser o banco local original, separado da demonstração.",
    );
  const source = new PrismaClient({
    adapter: new PrismaPg({ connectionString: sourceUrl, max: 1 }),
  });
  const demo = new PrismaClient({
    adapter: new PrismaPg({ connectionString: demoUrl, max: 1 }),
  });
  try {
    await mkdir(uploads, { recursive: true });
    const credentialsPath = resolve(demoRoot, "credentials.json");
    let credentials: { email: string; password: string; authSecret: string };
    try {
      credentials = JSON.parse(await readFile(credentialsPath, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      credentials = {
        email: "mari@admin.com.br",
        password: `Mari-${randomBytes(12).toString("base64url")}-Demo`,
        authSecret: randomBytes(48).toString("hex"),
      };
      await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), {
        flag: "wx",
        mode: 0o600,
      });
    }
    if (await demo.admin.count()) {
      console.log(
        "Demonstração já inicializada; alterações e credenciais preservadas.",
      );
    } else {
      const properties = await source.property.findMany({
        where: { status: "published" },
        include: {
          images: true,
          offers: true,
          tags: true,
          values: { where: { field: { public: true, archived: false } } },
        },
      });
      const tags = await source.tag.findMany();
      const taxonomies = await source.taxonomy.findMany();
      const fields = await source.customField.findMany({
        where: { public: true, archived: false },
        include: { options: true },
      });
      const settings = await source.siteSettings.findUnique({
        where: { id: "main" },
      });
      const content = {
        ...defaultContent,
        ...((settings?.published as object) || {}),
      };
      const contentKeys = Object.values(content)
        .filter(
          (value): value is string =>
            typeof value === "string" &&
            /^\/media\/[a-zA-Z0-9-]+\.webp$/.test(value),
        )
        .map((value) => value.slice(7));
      const contentMedia = await source.media.findMany({
        where: { key: { in: contentKeys } },
      });
      const allMedia = [
        ...new Map(
          [...properties.flatMap((p) => p.images), ...contentMedia].map((m) => [
            m.id,
            m,
          ]),
        ).values(),
      ];
      for (const media of allMedia) {
        if (!/^[a-zA-Z0-9-]+\.webp$/.test(media.key))
          throw new Error("Chave de imagem inválida.");
        await copyFile(
          resolve(process.env.UPLOAD_DIR || ".data/uploads", media.key),
          resolve(uploads, media.key),
        );
      }
      const passwordHash = await hashPassword(credentials.password);
      await demo.$transaction(
        async (tx) => {
          await tx.admin.create({
            data: {
              email: credentials.email,
              passwordHash,
              mustChangePassword: false,
            },
          });
          await tx.siteSettings.create({
            data: { id: "main", published: content },
          });
          for (const tag of tags) await tx.tag.upsert({ where: { id: tag.id }, create: tag, update: tag });
          for (const taxonomy of taxonomies)
            await tx.taxonomy.upsert({ where: { id: taxonomy.id }, create: taxonomy, update: taxonomy });
          for (const { options, ...field } of fields) {
            await tx.customField.upsert({ where: { id: field.id }, create: field, update: field });
            for (const option of options)
              await tx.fieldOption.create({ data: option });
          }
          for (const {
            images: _images,
            offers,
            tags: propertyTags,
            values,
            ...property
          } of properties) {
            void _images; // Gallery and site media are copied together below.
            await tx.property.create({
              data: {
                ...property,
                privateAddress: "",
                tags: { connect: propertyTags.map((t) => ({ id: t.id })) },
                offers: { create: offers.map(({ purpose, price, active }) => ({ purpose, price, active })) },
              },
            });
            for (const value of values)
              await tx.propertyValue.create({
                data: { ...value, value: value.value! },
              });
          }
          for (const media of allMedia)
            await tx.media.create({
              data: {
                ...media,
                propertyId: properties.some((p) => p.id === media.propertyId)
                  ? media.propertyId
                  : null,
              },
            });
          // Only synthetic CRM data. No leads, requests, passwords or sessions are copied.
          const demoLead = await tx.lead.create({
            data: {
              firstName: "Cliente Demonstração",
              phone: "5547999990001",
              source: "demonstracao",
              consentAt: new Date(),
              requests: {
                create: {
                  propertyId: properties[0]?.id,
                  message: "Solicitação fictícia para avaliar o CRM.",
                },
              },
            },
          });
          await tx.selection.create({ data: { leadId: demoLead.id, clientLeadId: demoLead.id, items: { create: properties.slice(0,2).map(p=>({propertyId:p.id})) } } });
        },
        { timeout: 60000 },
      );
      console.log(
        `Demonstração criada: ${properties.length} imóveis, ${allMedia.length} imagens e 1 interessado fictício. Dados originais preservados.`,
      );
    }
  } finally {
    await source.$disconnect();
    await demo.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
