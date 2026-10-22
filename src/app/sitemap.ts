import type { MetadataRoute } from "next";
import { db } from "@/lib/mari/db";
import { siteOrigin } from "@/config/origin";
import { isProductionDeployment } from "@/config/deployment";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { if (!isProductionDeployment()) return []; const items = await db.property.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }); return [...["", "/buscar", "/contato", "/privacidade"].map(path => ({ url: `${siteOrigin}${path}` })), ...items.map(p => ({ url: `${siteOrigin}/imovel/${p.slug}`, lastModified: p.updatedAt }))]; }
