import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { mariDb?: PrismaClient };
export const db =
  globalDb.mariDb ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ||
        (process.env.APP_ENV !== "production"
          ? "postgresql://postgres:postgres@127.0.0.1:54329/postgres"
          : undefined),
      // PGlite serves a single PostgreSQL connection internally; serialize the demo.
      max:
        process.env.DEMO_MODE === "true" ||
        /(?:localhost|127\.0\.0\.1):543(?:29|30)\//.test(
          process.env.DATABASE_URL || "127.0.0.1:54329/",
        )
          ? 1
          : 3,
      connectionTimeoutMillis: 10000,
    }),
  });
if (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true")
  globalDb.mariDb = db;
