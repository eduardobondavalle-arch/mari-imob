import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { site } from "@/config/site";
import { whatsappLink } from "@/lib/contact";
import { siteOrigin } from "@/config/origin";
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Caminho da página" className="breadcrumbs">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [{ label: "Início", href: "/" }, ...items].map(
              (item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.label,
                ...(item.href
                  ? { item: new URL(item.href, siteOrigin).href }
                  : {}),
              }),
            ),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Link href="/">Início</Link>
      {items.map((item, i) => (
        <span key={i}>
          <ChevronRight size={13} />
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function ContactCTA({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`contact-band ${compact ? "compact" : ""}`}>
      <div className="container contact-band-inner">
        <div>
          <span className="eyebrow">A gente ajuda você a encontrar</span>
          <h2>
            O próximo capítulo começa
            <br />
            com uma boa conversa.
          </h2>
        </div>
        <div>
          <p>
            Conte como você quer viver.
            <br />A Adim ajuda a encontrar o seu lugar.
          </p>
          <a
            href={whatsappLink()}
            className="button button-orange"
            target="_blank"
            rel="noopener noreferrer"
          >
            Fale com um especialista <ArrowUpRight size={19} />
          </a>
        </div>
      </div>
    </section>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" aria-label="Adim — início">
              <Image
                src="/brand/adim.png"
                width={165}
                height={74}
                alt="Adim Aluguéis"
                unoptimized
              />
            </Link>
            <p>
              Amamos alugar.
              <br />E fazer parte da sua próxima história.
            </p>
            <a href={site.clientPortal} className="footer-client">
              Área do cliente <ArrowUpRight size={15} />
            </a>
          </div>
          <div>
            <h3>Encontre seu lugar</h3>
            <Link href="/buscar?city=balneario-camboriu">
              Balneário Camboriú
            </Link>
            <Link href="/buscar?city=itajai">Itajaí e Praia Brava</Link>
            <Link href="/buscar?city=itapema">Itapema</Link>
            <Link href="/buscar?city=porto-belo">Porto Belo</Link>
            <Link href="/buscar">
              Todos os imóveis <ArrowRight size={13} />
            </Link>
          </div>
          <div>
            <h3>Somos a Adim</h3>
            <Link href="/sobre">Nossa história</Link>
            <Link href="/proprietarios">Anuncie seu imóvel</Link>
            <a href={site.blog}>Blog</a>
            <a href={site.documents}>Documentos</a>
            <a href={site.careers}>Trabalhe conosco</a>
          </div>
          <div className="footer-contact">
            <h3>Vamos conversar?</h3>
            <a href={site.phoneHref}>
              <Phone size={15} />
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <p>
              <MapPin size={16} />
              <span>
                {site.address}
                <br />
                {site.city}
                <br />
                CEP {site.zip}
              </span>
            </p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp"
            >
              <MessageCircle size={16} /> WhatsApp da Adim{" "}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Adim Aluguéis · CRECI {site.creci}
          </span>
          <span>Locação anual. Relações de confiança.</span>
          <Link href="/privacidade">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
export function EmptyState() {
  return (
    <div className="empty-state">
      <SearchIcon />
      <span className="eyebrow">Vamos tentar de outro jeito?</span>
      <h2>Nenhum imóvel por aqui.</h2>
      <p>
        Experimente ampliar a região ou ajustar os filtros para encontrar outras
        possibilidades.
      </p>
      <Link href="/buscar" className="button button-dark">
        Limpar filtros <ArrowRight size={18} />
      </Link>
    </div>
  );
}
function SearchIcon() {
  return (
    <div className="empty-icon">
      <MapPin size={35} />
    </div>
  );
}
