import "server-only";
import { cookies } from "next/headers";
import { randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import {
  digest,
  token,
  hashPassword,
  verifyPassword,
  otpDigest,
} from "./crypto";
import { assert, rateLimit, requestIp } from "./http";
import { phoneSchema } from "./validation";
import { ensureClientSelection } from "./client-selection";
export const production = () => process.env.APP_ENV === "production";
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
      production() || process.env.SITE_URL?.startsWith("https://") === true,
    sameSite: "lax",
    path: "/",
    maxAge,
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
  if (process.env.DEMO_MODE !== "true") {
    await rateLimit(`admin-ip:${requestIp(request)}`, 30);
    await rateLimit(`admin:${data.email.toLowerCase()}`, 8);
  }
  const admin = await db.admin.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  // Equal-cost password work even for an unknown account.
  const hash =
    admin?.passwordHash || (await hashPassword("invalid-account-password"));
  const valid = await verifyPassword(data.password, hash);
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
export async function sendOtp(input: unknown, request: Request) {
  const { phone } = z.object({ phone: phoneSchema }).parse(input);
  await rateLimit(`otp-ip:${requestIp(request)}`, 25);
  await rateLimit(`otp:${phone}`, 4);
  const code = String(randomInt(100000, 1000000));
  const provider = process.env.OTP_PROVIDER || "development";
  assert(
    !production() || provider !== "development",
    503,
    "Verificação indisponível. Contate a Mari pelo WhatsApp.",
  );
  const challenge = await db.otpChallenge.create({
    data: {
      phone,
      codeHash: otpDigest(phone, code),
      expiresAt: new Date(Date.now() + 5 * 60000),
    },
  });
  if (provider === "twilio") {
    assert(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM,
      503,
      "Provedor de verificação não configurado.",
    );
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `+${phone}`,
          From: process.env.TWILIO_FROM,
          Body: `Seu código de acesso à Mari Imóveis: ${code}. Válido por 5 minutos. Não compartilhe.`,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) {
      await db.otpChallenge.delete({ where: { id: challenge.id } });
      assert(false, 503, "Não foi possível enviar o código. Tente novamente.");
    }
  } else
    assert(
      provider === "development",
      503,
      "Provedor de verificação inválido.",
    );
  return {
    challengeId: challenge.id,
    ...(provider === "development"
      ? { developmentCode: code, development: true }
      : {}),
  };
}
export async function verifyOtp(input: unknown, request: Request) {
  const data = z
    .object({
      challengeId: z.string().max(100),
      code: z.string().regex(/^\d{6}$/),
      firstName: z.string().trim().min(2).max(60).optional(),
      consent: z.boolean().optional(),
    })
    .parse(input);
  await rateLimit(`verify:${requestIp(request)}`, 60);
  const challenge = await db.otpChallenge.findUnique({
    where: { id: data.challengeId },
  });
  assert(
    challenge &&
      !challenge.consumedAt &&
      challenge.expiresAt > new Date() &&
      challenge.attempts < 5,
    400,
    "Código expirado ou inválido. Solicite outro.",
  );
  const changed = await db.otpChallenge.updateMany({
    where: { id: challenge.id, attempts: { lt: 5 }, consumedAt: null },
    data: { attempts: { increment: 1 } },
  });
  assert(changed.count, 400, "Solicite um novo código.");
  const supplied = Buffer.from(otpDigest(challenge.phone, data.code), "hex");
  assert(
    timingSafeEqual(supplied, Buffer.from(challenge.codeHash, "hex")),
    400,
    "Código incorreto.",
  );
  let lead = await db.lead.findUnique({ where: { phone: challenge.phone } });
  if (!lead && (!data.firstName || !data.consent)) return { needsName: true };
  const consumed = await db.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  assert(consumed.count, 400, "Código já utilizado.");
  if (!lead)
    lead = await db.lead.upsert({
      where: { phone: challenge.phone },
      update: { phoneVerifiedAt: new Date(), lastActivityAt: new Date() },
      create: {
        phone: challenge.phone,
        firstName: data.firstName!,
        source: "acesso-cliente",
        consentAt: new Date(),
        phoneVerifiedAt: new Date(),
      },
    });
  else
    lead = await db.lead.update({
      where: { id: lead.id },
      data: { phoneVerifiedAt: new Date(), lastActivityAt: new Date() },
    });
  await ensureClientSelection(lead.id);
  await db.session.deleteMany({ where: { leadId: lead.id } });
  await createSession("client", lead.id);
  return { ok: true };
}
