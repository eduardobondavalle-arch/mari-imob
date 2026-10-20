import type { NextConfig } from "next";
const production = process.env.APP_ENV === "production";
if (production) {
  for (const key of ["DATABASE_URL", "AUTH_SECRET", "SITE_URL"]) if (!process.env[key]) throw new Error(`Configure ${key} para produção.`);
  if (process.env.AUTH_SECRET!.length < 32 || !process.env.SITE_URL!.startsWith("https://")) throw new Error("Produção exige HTTPS e AUTH_SECRET forte.");
  if (process.env.OTP_PROVIDER !== "twilio") throw new Error("Produção exige provedor real de verificação.");
  for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"]) if (!process.env[key]) throw new Error(`Configure ${key}.`);
}
const config: NextConfig = {
  devIndicators: false, poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "sharp"],
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
      ...(!production ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
    ] }];
  },
};
export default config;
