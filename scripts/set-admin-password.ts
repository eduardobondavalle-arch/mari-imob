import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/mari/crypto";

const databaseUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Configure TARGET_DATABASE_URL ou DATABASE_URL.");
const email = process.env.ADMIN_EMAIL || "mari@admin.com.br";
const password = process.env.ADMIN_PASSWORD || "Admin";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
async function main() {
  await prisma.admin.update({ where: { email }, data: { passwordHash: await hashPassword(password), mustChangePassword: false } });
  await prisma.$disconnect();
}
main();
