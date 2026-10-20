import type { MetadataRoute } from "next";
import { siteOrigin } from "@/config/origin";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/minha-selecao", "/selecao/", "/editor-preview"] }, sitemap: `${siteOrigin}/sitemap.xml` }; }
