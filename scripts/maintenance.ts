import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }) });
async function main() { try {
  const now = new Date();
  const sessions = await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  const codes = await db.otpChallenge.deleteMany({ where: { expiresAt: { lt: now } } });
  const limits = await db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  console.log({ expiredSessions: sessions.count, expiredCodes: codes.count, expiredCounters: limits.count });
} finally { await db.$disconnect(); } }
main().catch(() => { console.error("Não foi possível executar a manutenção."); process.exitCode = 1; });
