import type { MetadataRoute } from "next";
import { siteOrigin } from "@/config/origin";
import { isProductionDeployment } from "@/config/deployment";
export default function robots(): MetadataRoute.Robots { return isProductionDeployment() ? { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/minha-selecao", "/selecao/", "/editor-preview"] }, sitemap: `${siteOrigin}/sitemap.xml` } : { rules: { userAgent: "*", disallow: "/" } }; }
