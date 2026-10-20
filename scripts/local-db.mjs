import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { resolve, dirname } from "node:path";
import { mkdir } from "node:fs/promises";
if (process.env.APP_ENV === "production") throw new Error("Use PostgreSQL externo em produção.");
const dataDir = resolve(process.env.LOCAL_DB_DIR || ".data/postgres");
await mkdir(dirname(dataDir), { recursive: true });
const db = await PGlite.create({ dataDir });
const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: Number(process.env.LOCAL_DB_PORT || 54329), maxConnections: 10 });
await server.start();
console.log("PostgreSQL local persistente pronto em 127.0.0.1:" + (process.env.LOCAL_DB_PORT || 54329));
let stopping = false;
async function stop() { if (stopping) return; stopping = true; await server.stop(); await db.close(); process.exit(0); }
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
