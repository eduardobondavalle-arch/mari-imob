import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/mari/crypto";

const databaseUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Configure TARGET_DATABASE_URL ou DATABASE_URL.");
const email = process.env.ADMIN_EMAIL || "mari@admin.com.br";
const password = (() => {
  const value = process.env.ADMIN_PASSWORD;
  if (!value || value.length < 12)
    throw new Error(
      "Configure ADMIN_PASSWORD explicitamente com pelo menos 12 caracteres.",
    );
  return value;
})();
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
async function main() {
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    const admin = await tx.admin.update({
      where: { email },
      data: { passwordHash, mustChangePassword: true },
    });
    await tx.session.deleteMany({ where: { adminId: admin.id } });
  });
}
main().finally(() => prisma.$disconnect());
