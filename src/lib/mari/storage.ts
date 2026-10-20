import "server-only";
import sharp, { type OutputInfo } from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { db } from "./db";
import { assert } from "./http";
// Runtime uploads live on a persistent volume; they must not be bundled.
const storageRoot = () => resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || ".data/uploads");
function s3() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}
function supabaseStorage() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "property-media";
  assert(url && key, 503, "Armazenamento Supabase não configurado.");
  return {
    objectUrl: (objectKey: string) =>
      `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(objectKey)}`,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  };
}
async function assertStorageResponse(response: Response) {
  if (response.ok) return response;
  const message = await response.text().catch(() => "");
  console.error(
    "Falha no armazenamento externo:",
    response.status,
    message.slice(0, 300),
  );
  assert(
    false,
    502,
    "O armazenamento de imagens está temporariamente indisponível.",
  );
}
export async function uploadMedia(request: Request) {
  assert(
    Number(request.headers.get("content-length") || 0) <= 9 * 1024 * 1024,
    413,
    "Envie imagens de até 8 MB.",
  );
  // Enforce the limit while streaming, including requests without Content-Length.
  const reader = request.body?.getReader();
  assert(reader, 400, "Arquivo ausente.");
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 9 * 1024 * 1024) {
      await reader.cancel();
      assert(false, 413, "Envie imagens de até 8 MB.");
    }
    parts.push(value);
  }
  const form = await new Response(Buffer.concat(parts), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
  const file = form.get("file");
  assert(
    file instanceof File && file.size > 0 && file.size <= 8 * 1024 * 1024,
    400,
    "Envie uma imagem de até 8 MB.",
  );
  const input = Buffer.from(await file.arrayBuffer());
  let encoded: { data: Buffer; info: OutputInfo };
  try {
    const metadata = await sharp(input, {
      limitInputPixels: 40000000,
    }).metadata();
    assert(
      ["jpeg", "png", "webp", "avif"].includes(metadata.format || ""),
      400,
      "Use JPG, PNG, WebP ou AVIF.",
    );
    encoded = await sharp(input, { limitInputPixels: 40000000 })
      .rotate()
      .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    assert(
      false,
      400,
      "Arquivo inválido. Use JPG, PNG, WebP ou AVIF de até 40 megapixels.",
    );
  }
  const key = `${randomUUID()}.webp`;
  if (process.env.STORAGE_PROVIDER === "supabase") {
    const storage = supabaseStorage();
    await assertStorageResponse(
      await fetch(storage.objectUrl(key), {
        method: "POST",
        headers: {
          ...storage.headers,
          "Content-Type": "image/webp",
          "x-upsert": "false",
        },
        body: new Uint8Array(encoded.data),
      }),
    );
  } else if (process.env.STORAGE_PROVIDER === "s3")
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: encoded.data,
        ContentType: "image/webp",
      }),
    );
  else {
    await mkdir(storageRoot(), { recursive: true });
    await writeFile(resolve(storageRoot(), key), encoded.data, { flag: "wx" });
  }
  const media = await db.media.create({
    data: {
      key,
      alt: file.name.replace(/\.[^.]+$/, "").slice(0, 150),
      width: encoded.info.width,
      height: encoded.info.height,
      size: encoded.info.size,
    },
  });
  return { ...media, url: `/media/${key}` };
}
export async function readMedia(key: string) {
  assert(/^[a-f0-9-]{36}\.webp$/.test(key), 404, "Imagem não encontrada.");
  const row = await db.media.findUnique({ where: { key } });
  assert(row, 404, "Imagem não encontrada.");
  if (process.env.STORAGE_PROVIDER === "s3") {
    const object = await s3().send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
    assert(object.Body, 404, "Imagem não encontrada.");
    return new Uint8Array(await object.Body.transformToByteArray());
  }
  if (process.env.STORAGE_PROVIDER === "supabase") {
    const storage = supabaseStorage();
    const response = await fetch(storage.objectUrl(key), {
      headers: storage.headers,
      cache: "no-store",
    });
    if (response.status === 404) assert(false, 404, "Imagem não encontrada.");
    await assertStorageResponse(response);
    return new Uint8Array(await response.arrayBuffer());
  }
  return new Uint8Array(await readFile(/* turbopackIgnore: true */ resolve(storageRoot(), key)));
}
export async function deleteMedia(id: string) {
  const row = await db.media.findUnique({ where: { id } });
  assert(row, 404, "Imagem não encontrada.");
  assert(
    !row.propertyId,
    409,
    "Remova a imagem do imóvel e salve antes de excluir o arquivo.",
  );
  const content = await db.siteSettings.findUnique({ where: { id: "main" } });
  assert(
    !JSON.stringify(content).includes(row.key),
    409,
    "Esta imagem está em uso no site ou no rascunho.",
  );
  if (process.env.STORAGE_PROVIDER === "supabase") {
    const storage = supabaseStorage();
    const response = await fetch(storage.objectUrl(row.key), {
      method: "DELETE",
      headers: storage.headers,
    });
    if (response.status !== 404) await assertStorageResponse(response);
  } else if (process.env.STORAGE_PROVIDER === "s3")
    await s3().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: row.key }),
    );
  else
    await unlink(resolve(storageRoot(), row.key)).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  await db.media.delete({ where: { id } });
  return { ok: true };
}
