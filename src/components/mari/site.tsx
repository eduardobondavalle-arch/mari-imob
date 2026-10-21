"use client";
import { useEffect, useState } from "react";
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
import { PropertyDetail, PropertyGrid, whatsappLink } from "./property";
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
  ["Anuncie seu imóvel", "/proprietarios"],
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
            {content.facebook && <a href={content.facebook} target="_blank" rel="noopener noreferrer">Facebook <ArrowUpRight size={14} /></a>}
            {content.youtube && <a href={content.youtube} target="_blank" rel="noopener noreferrer">YouTube <ArrowUpRight size={14} /></a>}
            {content.linkedin && <a href={content.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a>}
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
      {content.whatsappEnabled && <a
        className="floating-contact floating-contact-photo"
        href={`https://wa.me/${content.whatsapp}?text=${encodeURIComponent(content.whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar com a Mari no WhatsApp"
      >
        <Image src={content.whatsappPhoto || "/mari-portrait.png"} alt="Mari" fill sizes="64px" />
        <span><MessageCircle size={15} /></span>
      </a>}
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
type HomeNews = { id: string; slug: string; title: string; summary: string; content: string; sourceUrl: string; city: string; coverImage: string; publishedAt: string };
export function Home({ featured, superFeatured = [], news = [] }: { featured: Listing[]; superFeatured?: Listing[]; news?: HomeNews[] }) {
  const { content, contact } = useMari();
  const [superOpen, setSuperOpen] = useState<Listing | null>(null);
  useEffect(() => {
    const onPopState = () => setSuperOpen(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  function openSuper(property: Listing) {
    window.history.pushState({ ...window.history.state, mariPreview: true }, "", `/imovel/${property.slug}`);
    setSuperOpen(property);
  }
  function closeSuper() {
    if (window.history.state?.mariPreview) window.history.back();
    setSuperOpen(null);
  }
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
      {superFeatured.length > 0 && (
        <section className="container section super-featured-section">
          <div className="section-heading"><div><p className="eyebrow">CURADORIA ESPECIAL DA MARI</p><h2>Super destaques</h2><p>Imóveis selecionados para quem procura algo singular.</p></div></div>
          <div className="super-featured-grid">
            {superFeatured.map((property) => <button type="button" className="super-featured-card" onClick={() => openSuper(property)} key={property.id}>
              {property.images[0] ? <Picture src={`/media/${property.images[0].key}`} alt={property.images[0].alt || property.title} /> : <div className="picture super-placeholder" />}
              <span className="super-featured-shade" />
              {property.images.length > 1 && <div className="super-thumbnails">{property.images.slice(1,4).map((photo) => <Picture key={photo.id} src={`/media/${photo.key}`} alt="" />)}</div>}
              <div className="super-featured-copy"><small>{property.city} · {property.neighborhood}</small><h3>{property.title}</h3>{property.headline && <p>{property.headline}</p>}<span className="super-facts">{property.bedrooms != null && `${property.bedrooms} dorm.`}{property.area != null && ` · ${property.area} m²`}{property.parking != null && ` · ${property.parking} vagas`}</span><strong>{property.price ? `R$ ${property.price.toLocaleString("pt-BR")}` : "Valor sob consulta"}</strong><span>Conhecer este imóvel <ArrowUpRight size={17}/></span></div>
            </button>)}
          </div>
          {superOpen && <Modal title="Super destaque" wide onClose={closeSuper}><PropertyDetail property={superOpen}/></Modal>}
        </section>
      )}
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
      <section className="owner-home-call">
        <div className="container owner-home-inner"><div><p className="eyebrow">PARA PROPRIETÁRIOS</p><h2>Seu imóvel merece as melhores oportunidades.</h2><p>Conte um pouco sobre ele e converse com a Mari sobre a melhor estratégia de venda ou locação.</p></div><Link className="button" href="/proprietarios">Quero anunciar meu imóvel <ArrowUpRight size={17}/></Link></div>
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
          {news.length ? (
            <div className="regional-news">
              <div className="regional-news-heading"><span>NOTÍCIAS DA REGIÃO</span><small>Informação para escolher bem</small></div>
              {news.map((item) => <Link href={!item.content && item.sourceUrl ? item.sourceUrl : `/noticias/${item.slug}`} target={!item.content && item.sourceUrl ? "_blank" : undefined} rel={!item.content && item.sourceUrl ? "noopener noreferrer" : undefined} key={item.id} className="regional-news-card">
                {item.coverImage && <Picture src={item.coverImage} alt="" />}
                <div><small>{item.city} · {new Date(item.publishedAt).toLocaleDateString("pt-BR")}</small><h3>{item.title}</h3><p>{item.summary}</p></div>
                <ArrowUpRight size={18} />
              </Link>)}
            </div>
          ) : <div className="region-art">
            <Waves size={78} strokeWidth={0.6} />
            <span>26°59′ S · 48°38′ O</span>
            <p>
              Encontre o seu
              <br />
              <em>horizonte.</em>
            </p>
          </div>}
        </div>
      </section>
      <section className="container section about-section">
        {(content.aboutImage || "/mari-portrait.png") ? (
          <Picture
            src={content.aboutImage || "/mari-portrait.png"}
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
          <p className="eyebrow">{content.aboutEyebrow}</p>
          <h2 className="pre-line">{content.aboutTitle}</h2>
          <p className="pre-line">{content.aboutText}</p>
          <Link className="button" href={content.aboutButtonUrl || "/contato"}>
            {content.aboutButtonText || "Vamos nos conhecer"} <ArrowUpRight size={18} />
          </Link>
          {content.instagram && <a className="about-instagram social-signature" href={content.instagram} target="_blank" rel="noopener noreferrer" aria-label="Acompanhe Mari no Instagram">@mari.imobbc <ArrowUpRight size={18}/></a>}
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
