import "server-only";

// Vercel fornece a URL única da prévia durante o build.
export const siteOrigin = (
  process.env.SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
