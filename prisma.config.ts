import { config } from "dotenv";
import { defineConfig } from "prisma/config";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    url:
      process.env.MIGRATION_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@127.0.0.1:54329/postgres",
  },
});
