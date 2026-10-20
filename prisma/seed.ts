import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/mari/crypto";
import { defaultContent } from "../src/lib/mari/defaults";
const production = process.env.APP_ENV === "production";
if (
  production &&
  (!process.env.INITIAL_ADMIN_PASSWORD ||
    process.env.INITIAL_ADMIN_PASSWORD === "Admin" ||
    process.env.INITIAL_ADMIN_PASSWORD.length < 12)
)
  throw new Error(
    "Defina uma senha administrativa forte antes da inicialização em produção.",
  );
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@127.0.0.1:54329/postgres",
    max: 1,
  }),
});
async function main() {
  await db.admin.upsert({
    where: { email: process.env.INITIAL_ADMIN_EMAIL || "mari@admin.com.br" },
    update: {},
    create: {
      email: process.env.INITIAL_ADMIN_EMAIL || "mari@admin.com.br",
      passwordHash: await hashPassword(
        process.env.INITIAL_ADMIN_PASSWORD || "Admin",
      ),
      mustChangePassword: true,
    },
  });
  await db.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", published: defaultContent },
  });
  for (const name of [
    "Abaixo do preço",
    "Exclusividade",
    "Aceita permuta",
    "Oportunidade",
    "Frente mar",
  ])
    if(name !== "Aceita permuta" || !(await db.tag.findUnique({ where: { key: "trade_in" } })))
      await db.tag.upsert({ where: { name }, update: name === "Aceita permuta" ? { key: "trade_in" } : {}, create: { name, ...(name === "Aceita permuta" ? { key: "trade_in" } : {}) } });
  for (const [kind, names] of [
    ["category", ["Residencial", "Comercial", "Terreno"]],
    ["situation", ["Pronto para morar", "Em construção", "Lançamento"]],
  ] as const)
    for (const name of names)
      await db.taxonomy.upsert({
        where: { kind_name: { kind, name } },
        update: {},
        create: { kind, name },
      });
  console.log(
    "Inicialização concluída. Nenhum imóvel fictício foi cadastrado.",
  );
}
main().finally(() => db.$disconnect());
