import type { Metadata } from "next";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/cormorant-garamond";
import "./mari.css";
import "@/styles/mari-v2.css";
import { MariProvider } from "@/components/mari/provider";
import { PublicFrame } from "@/components/mari/site";
import { getContent } from "@/lib/mari/catalog";
import { siteOrigin } from "@/config/origin";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return { metadataBase: new URL(siteOrigin), title: { default: `${content.brandName} Corretora de Imóveis | Seu lugar no litoral`, template: `%s | ${content.brandName} Imóveis` }, description: content.heroSubtitle, robots: { index: process.env.APP_ENV === "production", follow: process.env.APP_ENV === "production" }, icons: { icon: content.favicon || "/brand/mari-imob-favicon.png" }, openGraph: { type: "website", locale: "pt_BR", siteName: `${content.brandName} Corretora de Imóveis`, title: `${content.brandName} Corretora de Imóveis`, description: content.heroSubtitle, images: content.heroImage ? [{ url: content.heroImage }] : [] } };
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body><MariProvider initialContent={content} presentation={process.env.PRESENTATION_MODE === "true"} demo={process.env.DEMO_MODE === "true"}><PublicFrame>{children}</PublicFrame></MariProvider></body></html>;
}
