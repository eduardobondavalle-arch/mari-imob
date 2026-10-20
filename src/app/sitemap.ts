import type { MetadataRoute } from "next";
import { db } from "@/lib/mari/db";
import { siteOrigin } from "@/config/origin";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { if (process.env.APP_ENV !== "production") return []; const items = await db.property.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }); return [...["", "/buscar", "/contato", "/privacidade"].map(path => ({ url: `${siteOrigin}${path}` })), ...items.map(p => ({ url: `${siteOrigin}/imovel/${p.slug}`, lastModified: p.updatedAt }))]; }
