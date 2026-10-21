"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Heart,
  Menu,
  UserRound,
  MapPin,
  Search,
  Waves,
  Compass,
  MessageCircle,
} from "lucide-react";
import { useMari } from "./provider";
import { Modal, Picture } from "./ui";
import { PropertyGrid, whatsappLink } from "./property";
import { type Listing, type Field, purposes } from "@/lib/mari/types";
export function Brand() {
  const { content } = useMari();
  return (
    <Link
      href="/"
      className="brand"
      aria-label={`${content.brandName} · Página inicial`}
    >
      {content.logo ? (
        <Image
          src={content.logo}
          alt={content.brandName}
          width={300}
          height={91}
          className="brand-image"
          priority
        />
      ) : (
        <>
          <span>
            {content.brandName}
            <i>.</i>
          </span>
          <small>CORRETORA DE IMÓVEIS</small>
        </>
      )}
    </Link>
  );
}
const links = [
  ["Início", "/"],
  ["Comprar", "/buscar?purpose=sale"],
  ["Alugar", "/buscar?purpose=rent"],
  ["Imóveis", "/buscar"],
  ["Consultoria", "/consultoria"],
  ["Contato", "/contato"],
];
export function PublicFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { content, client, openLogin } = useMari();
  const [menu, setMenu] = useState(false);
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="topline">
        BALNEÁRIO CAMBORIÚ, CAMBORIÚ & PRAIA BRAVA{" "}
        <span>Um lugar para cada novo começo.</span>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav aria-label="Menu principal" className="desktop-nav">
            {links.map(([label, href]) => (
              <Link key={label} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link
              href="/minha-selecao"
              className="selection-link"
              aria-label={`Minha Seleção, ${client?.items.length || 0} imóveis`}
            >
              <Heart size={20} />
              <span className="selection-label">Minha Seleção</span>
              <b>{client?.items.length || 0}</b>
            </Link>
            <button className="client-login" aria-label="Acesso do cliente" onClick={openLogin}>
              <UserRound size={17} />
              <span>{client ? client.firstName : "Acesso do cliente"}</span>
            </button>
            <button
              className="mobile-menu icon-button"
              aria-label="Abrir menu"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Brand />
            <p>{content.footerText}</p>
            <small>
              {content.professionalInfo}
              {content.creci && (
                <>
                  <br />
                  {content.creci}
                </>
              )}
            </small>
          </div>
          <div>
            <h3>Encontre seu lugar</h3>
            {links.slice(1, 5).map(([label, href]) => (
              <Link key={label} href={href}>
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Vamos conversar</h3>
            <a
              href={whatsappLink(content.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp <ArrowUpRight size={14} />
            </a>
            {content.instagram && (
              <a
                href={content.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram <ArrowUpRight size={14} />
              </a>
            )}
            <Link href="/contato">Solicitar contato</Link>
            <p>
              Balneário Camboriú, Camboriú e Praia Brava
              <br />
              Santa Catarina
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} {content.brandName} Corretora de
            Imóveis
          </span>
          <Link href="/privacidade">Privacidade e seus dados</Link>
        </div>
      </footer>
      <a
        className="floating-contact"
        href={whatsappLink(content.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar com a Mari no WhatsApp"
      >
        <MessageCircle size={24} />
      </a>
      {menu && (
        <Modal title="Menu" onClose={() => setMenu(false)}>
          <nav className="mobile-nav" aria-label="Menu mobile">
            {links.map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={20} />
              </Link>
            ))}
            <button
              onClick={() => {
                setMenu(false);
                openLogin();
              }}
            >
              Acesso do cliente
            </button>
          </nav>
        </Modal>
      )}
    </>
  );
}
export function Home({ featured }: { featured: Listing[] }) {
  const { content, contact } = useMari();
  return (
    <>
      <section className="hero">
        <div className="hero-image">
          {content.heroImage && (
            <Image
              src={content.heroImage}
              alt="Paisagem costeira ilustrativa"
              fill
              sizes="100vw"
              priority
            />
          )}
        </div>
        <div className="hero-shade" />
        <div className="container hero-content">
          <p className="eyebrow">
            <span /> SEU LUGAR NO LITORAL
          </p>
          <h1 className="pre-line">{content.heroTitle}</h1>
          <p>{content.heroSubtitle}</p>
          <a href="#encontrar" className="hero-discover">
            Encontre seu próximo endereço <ArrowDown size={17} />
          </a>
        </div>
        <span className="hero-location">
          <MapPin size={14} /> Santa Catarina, Brasil
        </span>
        {content.heroImage === "/images/coast.png" && (
          <span className="image-credit">Paisagem ilustrativa</span>
        )}
      </section>
      <section className="container home-search" id="encontrar">
        <SearchBox />
      </section>
      <section className="container section featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">UMA ESCOLHA COM SIGNIFICADO</p>
            <h2>{content.featuredTitle}</h2>
          </div>
          <Link className="text-link" href="/buscar">
            Explorar todos os imóveis <ArrowUpRight size={18} />
          </Link>
        </div>
        {featured.length ? (
          <PropertyGrid items={featured} />
        ) : (
          <div className="empty-curated">
            <div className="empty-symbol">
              <Compass size={33} strokeWidth={1} />
            </div>
            <div>
              <h3>A sua busca merece atenção.</h3>
              <p>
                Novas oportunidades serão apresentadas aqui. Enquanto isso,
                conte à Mari o que faz um lugar ser seu.
              </p>
            </div>
            <button className="button secondary" onClick={() => contact()}>
              Conte o que procura <ArrowUpRight size={17} />
            </button>
          </div>
        )}
      </section>
      <section className="region-section">
        <div className="container region-inner">
          <div>
            <p className="eyebrow">ENTRE O MAR E A SUA PRÓXIMA HISTÓRIA</p>
            <h2>
              O litoral como
              <br />
              parte da sua vida.
            </h2>
            <p>
              De Balneário Camboriú e Camboriú à atmosfera da Praia Brava. Explore
              possibilidades para o seu jeito de viver.
            </p>
            <div className="region-links">
              <Link href="/buscar?city=Balne%C3%A1rio+Cambori%C3%BA">
                Balneário Camboriú <ArrowUpRight size={18} />
              </Link>
              <Link href="/buscar?city=Cambori%C3%BA">
                Camboriú <ArrowUpRight size={18} />
              </Link>
              <Link href="/buscar?city=Itaja%C3%AD&neighborhood=Praia+Brava">
                Praia Brava <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="region-art">
            <Waves size={78} strokeWidth={0.6} />
            <span>26°59′ S · 48°38′ O</span>
            <p>
              Encontre o seu
              <br />
              <em>horizonte.</em>
            </p>
          </div>
        </div>
      </section>
      <section className="container section about-section">
        {content.aboutImage ? (
          <Picture
            src={content.aboutImage}
            alt="Mari Corretora de Imóveis"
            className="about-photo"
          />
        ) : (
          <div className="about-monogram">
            <span>
              M<i>.</i>
            </span>
            <small>ESCOLHAS QUE ABREM NOVOS CAMINHOS</small>
          </div>
        )}
        <div>
          <p className="eyebrow">UM ATENDIMENTO PRÓXIMO, DO SEU JEITO</p>
          <h2 className="pre-line">{content.aboutTitle}</h2>
          <p className="pre-line">{content.aboutText}</p>
          <button className="button" onClick={() => contact()}>
            Vamos nos conhecer <ArrowUpRight size={18} />
          </button>
          <p className="signature">Mari</p>
        </div>
      </section>
      <ContactSection />
    </>
  );
}
export function ContactSection() {
  const { content, contact } = useMari();
  return (
    <section className="contact-section">
      <div className="container">
        <p className="eyebrow">O PRÓXIMO PASSO É SEU</p>
        <h2>{content.contactTitle}</h2>
        <div className="button-row">
          <a
            className="button light"
            href={whatsappLink(content.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conversar no WhatsApp <ArrowUpRight size={18} />
          </a>
          <button className="button outline-light" onClick={() => contact()}>
            Solicitar contato <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
type SearchData = {
  fields: Field[];
  locations: { city: string; neighborhood: string; type: string }[];
  tags: { id: string; name: string }[];
};
export function SearchBox({
  data,
  initial = {},
  expanded = false,
  preserveQuery = "",
}: {
  data?: SearchData;
  initial?: Record<string, string>;
  expanded?: boolean;
  preserveQuery?: string;
}) {
  const [purpose, setPurpose] = useState(initial.purpose ?? "sale");
  const [city, setCity] = useState(initial.city || "");
  const cities = [
    ...new Set([
      "Balneário Camboriú",
      "Camboriú",
      "Itajaí",
      ...(data?.locations.map((l) => l.city) || []),
    ]),
  ];
  return (
    <form
      action="/buscar"
      className={`search-box ${expanded ? "search-expanded" : ""}`}
    >
      <div className="search-tabs" role="group" aria-label="Finalidade">
        {Object.entries(purposes).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={purpose === value ? "active" : ""}
            onClick={() => setPurpose(value)}
            aria-pressed={purpose === value}
          >
            {label}
          </button>
        ))}
        {expanded && (
          <button
            type="button"
            className={!purpose ? "active" : ""}
            onClick={() => setPurpose("")}
          >
            Todas
          </button>
        )}
      </div>
      <input type="hidden" name="purpose" value={purpose} />
      {!expanded && Array.from(new URLSearchParams(preserveQuery).entries()).filter(([key]) => !["purpose", "city", "cityId", "type", "maxPrice", "page"].includes(key)).map(([key,value], index) => <input key={`${key}-${index}`} type="hidden" name={key} value={value}/>)}
      <div className="search-fields">
        <label>
          ONDE VOCÊ QUER ESTAR?
          <select
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          TIPO DE IMÓVEL
          <select name="type" defaultValue={initial.type || ""}>
            <option value="">Todos os tipos</option>
            {[
              ...new Set(
                data?.locations.map((l) => l.type) || [
                  "Apartamento",
                  "Casa",
                  "Cobertura",
                  "Terreno",
                  "Comercial",
                ],
              ),
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          ATÉ QUAL VALOR?
          <input
            name="maxPrice"
            type="number"
            min="0"
            placeholder="Sem limite de valor"
            defaultValue={initial.maxPrice}
          />
        </label>
        <button className="button search-submit">
          <Search size={18} /> Encontrar imóveis
        </button>
      </div>
      {expanded && (
        <div className="expanded-fields">
          <label>
            Bairro
            <select
              name="neighborhood"
              defaultValue={initial.neighborhood || ""}
            >
              <option value="">Todos</option>
              {[
                ...new Set(
                  data?.locations
                    .filter((l) => !city || l.city === city)
                    .map((l) => l.neighborhood),
                ),
              ].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Título ou código
            <input name="q" defaultValue={initial.q} />
          </label>
          <label>
            Valor mínimo
            <input
              type="number"
              min="0"
              name="minPrice"
              defaultValue={initial.minPrice}
            />
          </label>
          <label>
            Quartos
            <select name="bedrooms" defaultValue={initial.bedrooms || ""}>
              <option value="">Qualquer quantidade</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ou mais
                </option>
              ))}
            </select>
          </label>
          <label>
            Tags
            <select name="tag" defaultValue={initial.tag || ""}>
              <option value="">Todas</option>
              {data?.tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordenar por
            <select name="sort" defaultValue={initial.sort || "relevance"}>
              <option value="relevance">Relevância</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </label>
          {data?.fields.map((f) => (
            <label key={f.id}>
              {f.label}
              {["boolean", "select", "multiselect"].includes(f.type) ? (
                <select
                  name={`field_${f.id}`}
                  defaultValue={initial[`field_${f.id}`] || ""}
                >
                  <option value="">Todos</option>
                  {f.type === "boolean" ? (
                    <>
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </>
                  ) : (
                    f.options.map((o) => (
                      <option key={o.id} value={o.value}>
                        {o.value}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <input
                  name={`field_${f.id}`}
                  defaultValue={initial[`field_${f.id}`]}
                  type={
                    ["number", "money"].includes(f.type)
                      ? "number"
                      : f.type === "date"
                        ? "date"
                        : "text"
                  }
                  step="any"
                />
              )}
            </label>
          ))}
          <Link className="text-button" href="/buscar">
            Limpar filtros
          </Link>
        </div>
      )}
    </form>
  );
}
