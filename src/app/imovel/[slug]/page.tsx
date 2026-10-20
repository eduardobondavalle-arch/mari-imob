import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListing } from "@/lib/mari/catalog";
import { PropertyDetail } from "@/components/mari/property";
import { siteOrigin } from "@/config/origin";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const p = await getListing((await params).slug); if (!p) return { title: "Imóvel indisponível", robots: { index: false } }; return { title: p.title, description: p.headline || p.description.slice(0, 160), alternates: { canonical: `/imovel/${p.slug}` }, openGraph: { title: p.title, description: p.headline || p.description.slice(0, 160), url: `/imovel/${p.slug}`, images: p.images.map(i => ({ url: `/media/${i.key}`, alt: i.alt })) } }; }
export default async function Page({ params }: Props) { const p = await getListing((await params).slug); if (!p) notFound(); const structured = { "@context": "https://schema.org", "@type": "RealEstateListing", name: p.title, description: p.description, url: `${siteOrigin}/imovel/${p.slug}`, image: p.images.map(i => `${siteOrigin}/media/${i.key}`), ...(p.price !== null ? { offers: { "@type": "Offer", price: p.price, priceCurrency: "BRL", availability: "https://schema.org/InStock" } } : {}) }; return <div className="container standalone-property"><PropertyDetail property={p} standalone/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}/></div>; }
