import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/mari/crypto";
import { defaultContent } from "../src/lib/mari/defaults";
import { initialAdminCredentials } from "../src/lib/mari/initial-admin";
// Validate credentials before Prisma can connect to or mutate any database.
const initialAdmin = initialAdminCredentials();
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
    where: { email: initialAdmin.email },
    update: {},
    create: {
      email: initialAdmin.email,
      passwordHash: await hashPassword(initialAdmin.password),
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
    "Aceita parcelamento",
    "Oportunidade",
    "Frente mar",
  ])
    if(name !== "Aceita permuta" || !(await db.tag.findUnique({ where: { key: "trade_in" } }))) {
      const key = name === "Aceita permuta" ? "trade_in" : name === "Aceita parcelamento" ? "installment" : undefined;
      await db.tag.upsert({ where: { name }, update: key ? { key } : {}, create: { name, ...(key ? { key } : {}) } });
    }
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
