import { ZodError } from "zod";
import { db } from "./db";
import { digest } from "./crypto";
import { allowedOrigin } from "./request-origin";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}
export function assert(
  value: unknown,
  status: number,
  message: string,
): asserts value {
  if (!value) throw new HttpError(status, message);
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.SITE_URL || request.url).origin;
  assert(
    allowedOrigin(origin, expected, process.env.APP_ENV),
    403,
    "Origem da solicitação não permitida. Abra o site pelo endereço configurado.",
  );
  assert(
    request.headers.get("sec-fetch-site") !== "cross-site",
    403,
    "Solicitação não permitida.",
  );
}
export async function readJson(request: Request): Promise<unknown> {
  assert(
    request.headers.get("content-type")?.includes("application/json"),
    415,
    "Envie dados JSON.",
  );
  const reader = request.body?.getReader();
  assert(reader, 400, "Dados ausentes.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 150000) {
      await reader.cancel();
      throw new HttpError(413, "Dados muito grandes.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Dados inválidos.");
  }
}
export async function rateLimit(key: string, limit = 10, seconds = 900) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const row = await db.rateLimit.upsert({
    where: { key: digest(`${key}:${bucket}`) },
    create: {
      key: digest(`${key}:${bucket}`),
      expiresAt: new Date((bucket + 1) * seconds * 1000),
    },
    update: { count: { increment: 1 } },
  });
  assert(
    row.count <= limit,
    429,
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  );
}
export function requestIp(request: Request) {
  // Only trust this header when a controlled reverse proxy overwrites it.
  return process.env.TRUST_PROXY === "true"
    ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "local";
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message, ...error.details },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return Response.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  )
    return Response.json(
      {
        error: "Este registro já existe. Atualize a página e tente novamente.",
      },
      { status: 409 },
    );
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2025"
  )
    return Response.json(
      { error: "Registro não encontrado." },
      { status: 404 },
    );
  console.error(
    "Falha na operação:",
    error instanceof Error ? error.name : "unknown",
  );
  return Response.json(
    { error: "Não foi possível concluir. Tente novamente em instantes." },
    { status: 500 },
  );
}
