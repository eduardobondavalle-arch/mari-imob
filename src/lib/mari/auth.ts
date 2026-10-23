import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import {
  digest,
  token,
  hashPassword,
  verifyPassword,
} from "./crypto";
import { assert, rateLimit, requestIp } from "./http";
import { isProductionDeployment } from "@/config/deployment";
export const production = isProductionDeployment;
const INVALID_PASSWORD_HASH =
  "00000000000000000000000000000000:531358f1e5f2238ab188f7bb65c108d408eefe9a6e59e7814d08b6a1fc4ce241b822aea01732d975dcb80ac143bdfcbfa43d279717da756274bfb09dc72d4f4d";
export async function session(role: "admin" | "client") {
  const value = (await cookies()).get(`mari_${role}`)?.value;
  if (!value) return null;
  const row = await db.session.findUnique({
    where: { tokenHash: digest(value) },
    include: { admin: true, lead: true },
  });
  if (
    !row ||
    row.expiresAt < new Date() ||
    (role === "admin" ? !row.adminId : !row.leadId)
  )
    return null;
  return row;
}
export async function requireAdmin(allowPasswordChange = false) {
  const row = await session("admin");
  assert(row?.admin, 401, "Entre na administração para continuar.");
  assert(
    allowPasswordChange || !row.admin.mustChangePassword || !production(),
    403,
    "Altere a senha inicial antes de continuar.",
  );
  return row.admin;
}
export async function requireClient() {
  const row = await session("client");
  assert(row?.lead, 401, "Acesse sua seleção para continuar.");
  return row.lead;
}
export async function createSession(role: "admin" | "client", id: string) {
  const raw = token();
  const maxAge = role === "admin" ? 8 * 3600 : 30 * 86400;
  const previous = (await cookies()).get(`mari_${role}`)?.value;
  if (previous)
    await db.session.deleteMany({ where: { tokenHash: digest(previous) } });
  await db.session.create({
    data: {
      tokenHash: digest(raw),
      [role === "admin" ? "adminId" : "leadId"]: id,
      expiresAt: new Date(Date.now() + maxAge * 1000),
    },
  });
  (await cookies()).set(`mari_${role}`, raw, {
    httpOnly: true,
    secure:
      process.env.VERCEL === "1" ||
      production() ||
      process.env.SITE_URL?.startsWith("https://") === true,
    sameSite: "lax",
    path: "/",
    maxAge,
    priority: "high",
  });
}
export async function logout(role: "admin" | "client") {
  const jar = await cookies();
  const raw = jar.get(`mari_${role}`)?.value;
  if (raw) await db.session.deleteMany({ where: { tokenHash: digest(raw) } });
  jar.delete(`mari_${role}`);
}
export async function adminLogin(input: unknown, request: Request) {
  const data = z
    .object({
      email: z.string().trim().max(200).pipe(z.email()),
      password: z.string().min(1).max(200),
    })
    .parse(input);
  await rateLimit(`admin-ip:${requestIp(request)}`, 30);
  const admin = await db.admin.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  // Exactly one scrypt verification for both known and unknown accounts.
  const hash = admin?.passwordHash || INVALID_PASSWORD_HASH;
  const valid = await verifyPassword(data.password, hash);
  // Account buckets record only failed credentials. A third party cannot lock
  // the legitimate administrator out merely by knowing the email address.
  if (!admin || !valid)
    await rateLimit(`admin:${data.email.toLowerCase()}`, 8);
  assert(admin && valid, 401, "E-mail ou senha incorretos.");
  await createSession("admin", admin.id);
  return { ok: true, mustChangePassword: admin.mustChangePassword };
}
export async function changePassword(input: unknown) {
  const admin = await requireAdmin(true);
  const data = z
    .object({
      currentPassword: z.string().max(200),
      password: z.string().min(12).max(200),
    })
    .parse(input);
  assert(
    await verifyPassword(data.currentPassword, admin.passwordHash),
    400,
    "Senha atual incorreta.",
  );
  assert(
    data.password !== data.currentPassword,
    400,
    "Escolha uma nova senha.",
  );
  await db.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash: await hashPassword(data.password),
      mustChangePassword: false,
    },
  });
  await db.session.deleteMany({ where: { adminId: admin.id } });
  await createSession("admin", admin.id);
  return { ok: true };
}
