"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Building,
  Sparkles,
  ArrowRight,
  Clock,
  Repeat,
} from "lucide-react";
import { type Listing, priceLabel } from "@/lib/mari/types";
import { whatsappLink, hasTradeIn } from "./property";
import { useMari } from "./provider";
import { PropertyCharacteristics } from "./property-characteristics";
import { purposes } from "@/lib/mari/types";

export function SelectionPresentation({
  items,
  title = "Uma seleção especial para você",
  recipientName = "",
}: {
  items: Listing[];
  title?: string;
  recipientName?: string;
}) {
  const [selected, setSelected] = useState(items[0]?.id);
  const [offerPurpose, setOfferPurpose] = useState("");
  const [origin, setOrigin] = useState("");
  const { content, client, select } = useMari();
  const active = items.find((p) => p.id === selected) || items[0];
  const activeOffer = active?.offers.find((offer) => offer.active && offer.purpose === (offerPurpose || active.purpose)) || active?.offers.find((offer) => offer.active);
  const shownActive = active ? { ...active, purpose: activeOffer?.purpose || active.purpose, price: activeOffer?.price ?? active.price } : active;
  useEffect(() => {
    const timer = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!active) {
    return (
      <div className="empty-state">
        <h2>Nenhum imóvel disponível nesta seleção.</h2>
        <Link className="button" href="/buscar">
          Explorar imóveis
        </Link>
      </div>
    );
  }

  const isSaved = client?.items.some((i) => i.id === active.id);
  const brokerName = content.brandName || "Mari Lucia da Silva";
  const brokerPhone = content.whatsapp || "554789168857";

  return (
    <section className="cri-presentation">
      {/* 1. Header do topo da apresentação */}
      <div className="cri-topbar">
        <div className="cri-brand-info">
          <Link href="/" className="cri-brand-logo">
            {content.logo ? (
              <Image
                src={content.logo}
                alt={content.brandName}
                width={220}
                height={67}
                className="cri-brand-image"
              />
            ) : (
              <div className="cri-text-logo">
                <strong>MARI IMÓVEIS</strong>
                <small>APRESENTADO POR {brokerName.toUpperCase()}</small>
              </div>
            )}
          </Link>
        </div>
        <a
          className="button cri-btn-contact"
          href={whatsappLink(brokerPhone, shownActive, shownActive.purpose, origin)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={16} /> Falar com o corretor
        </a>
      </div>

      {/* 2. Intro / Saudação personalizada */}
      <div className="cri-intro-box">
        <div className="cri-intro-text">
          <span className="cri-badge-tag">Seleção de imóveis</span>
          <h1>{recipientName ? `Olá, ${recipientName}` : title}</h1>
          <p>
            {recipientName
              ? `${recipientName}, aqui está sua seleção de imóveis.`
              : "Segue uma seleção de imóveis preparada para sua avaliação."}
          </p>
        </div>
        <div className="cri-intro-date">
          <Clock size={15} />
          <span>Disponível para sua consulta</span>
        </div>
      </div>

      {/* 3. Carrossel horizontal de mini-cards */}
      {items.length > 1 && (
        <div className="cri-options-wrapper">
          <div className="cri-options-label">EXPLORE AS OPÇÕES SELECIONADAS</div>
          <div className="cri-options-strip" role="tablist" aria-label="Imóveis da seleção">
            {items.map((p) => {
              const isActive = p.id === active.id;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`cri-mini-card ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    setSelected(p.id);
                    document.querySelector(".cri-hero-banner")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <div className="cri-mini-thumb">
                    {p.images[0] ? (
                      <Image
                        src={`/media/${p.images[0].key}`}
                        alt={p.title}
                        width={90}
                        height={64}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="image-empty" style={{ width: 90, height: 64 }}>
                        <Building size={20} />
                      </div>
                    )}
                  </div>
                  <div className="cri-mini-info">
                    <strong>{p.title}</strong>
                    <small>
                      {p.neighborhood} · {priceLabel(p.price)}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Banner Hero do Imóvel Selecionado */}
      <div className="cri-hero-banner">
        {active.images[0] ? (
          <Image
            src={`/media/${active.images[0].key}`}
            alt={active.images[0].alt || active.title}
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="cri-hero-placeholder">
            <Building size={48} />
          </div>
        )}
        <div className="cri-hero-gradient" />

        {/* Botão de favoritar */}
        <button
          className={`cri-fav-btn ${isSaved ? "is-saved" : ""}`}
          aria-label={isSaved ? "Remover da minha seleção" : "Adicionar à minha seleção"}
          onClick={() => select(active)}
        >
          <Heart size={22} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {/* Badges e Título em Caixa Alta */}
        <div className="cri-hero-content">
          <div className="cri-hero-badges">
            <span className="cri-hero-tag">{active.type.toUpperCase()}</span>
            {active.area !== null && <span className="cri-hero-tag">{active.area} m²</span>}
            {active.bedrooms !== null && (
              <span className="cri-hero-tag">
                {active.bedrooms} {active.bedrooms === 1 ? "DORMITÓRIO" : "DORMITÓRIOS"}
              </span>
            )}
            {active.suites !== null && (
              <span className="cri-hero-tag">
                {active.suites} {active.suites === 1 ? "SUÍTE" : "SUÍTES"}
              </span>
            )}
            {active.parking !== null && (
              <span className="cri-hero-tag">
                {active.parking} {active.parking === 1 ? "VAGA" : "VAGAS"}
              </span>
            )}
            {hasTradeIn(active.tags) && (
              <span className="cri-hero-tag cri-tag-permuta">
                <Repeat size={12} strokeWidth={2.5} /> ACEITA PERMUTA
              </span>
            )}
          </div>
          <h2 className="cri-hero-title">{active.title.toUpperCase()}</h2>
        </div>
      </div>

      {/* 5. Barra do Especialista & Preço */}
      <div className="cri-broker-bar">
        <div className="cri-broker-profile">
          <div className="cri-broker-avatar">
            {content.aboutImage ? (
              <Image src={content.aboutImage} alt={brokerName} width={56} height={56} style={{ objectFit: "cover" }} />
            ) : (
              <span>M</span>
            )}
          </div>
          <div className="cri-broker-meta">
            <small>SEU ESPECIALISTA</small>
            <strong>{brokerName}</strong>
            <span>{content.whatsapp ? `+${content.whatsapp}` : "(47) 98916-8857"}</span>
          </div>
        </div>

        <div className="cri-price-actions">
          <div className="cri-price-display">
            {active.offers.filter((offer) => offer.active).length > 1 && <div className="offer-selector cri-offer-selector">
              {active.offers.filter((offer) => offer.active).map((offer) => <button type="button" key={offer.purpose} className={shownActive.purpose === offer.purpose ? "active" : ""} onClick={() => setOfferPurpose(offer.purpose)}>{purposes[offer.purpose]}</button>)}
            </div>}
            <small>{shownActive.purpose === "rent" ? "Locação mensal" : "Valor do imóvel"}</small>
            <strong>{priceLabel(shownActive.price)}</strong>
          </div>
          <a
            className="button cri-btn-interest"
            href={whatsappLink(brokerPhone, shownActive, shownActive.purpose, origin)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} /> Tenho interesse
          </a>
        </div>
      </div>

      {/* 6. Especificações do Imóvel */}
      <div className="cri-specs-section">
        <h3>Especificações do imóvel</h3>
        <PropertyCharacteristics property={active} />
      </div>

      {/* 7. Sobre o Empreendimento */}
      <div className="cri-about-section">
        <h3>Sobre o empreendimento</h3>
        <p className="cri-description pre-line">{active.description}</p>
      </div>

      {/* 8. Galeria - Conheça cada detalhe */}
      {active.images.length > 0 && (
        <div className="cri-gallery-section">
          <div className="cri-gallery-heading">
            <small>GALERIA</small>
            <h3>Conheça cada detalhe</h3>
          </div>
          <div className="cri-mosaic-grid">
            {active.images.map((img, idx) => (
              <div key={img.id || idx} className="cri-mosaic-item">
                <Image
                  src={`/media/${img.key}`}
                  alt={img.alt || active.title}
                  width={600}
                  height={400}
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Card Call to Action */}
      <div className="cri-cta-banner">
        <div className="cri-cta-text">
          <div className="cri-cta-icon-row">
            <Sparkles size={18} className="cri-sparkle-icon" />
            <strong>Quer conhecer este imóvel?</strong>
          </div>
          <p>Fale com a Mari e receba o book completo com plantas, vídeos e condições de negociação.</p>
        </div>
        <a
          className="button cri-cta-btn"
          href={whatsappLink(brokerPhone, shownActive, shownActive.purpose, origin)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={17} /> Falar agora
        </a>
      </div>

      {/* 10. Seleção Exclusiva - Outras Oportunidades */}
      {items.length > 1 && (
        <div className="cri-other-section">
          <div className="cri-other-heading">
            <small>SELEÇÃO EXCLUSIVA</small>
            <h3>Outras oportunidades para você</h3>
          </div>
          <div className="cri-other-grid">
            {items
              .filter((p) => p.id !== active.id)
              .map((p) => (
                <article key={p.id} className="cri-other-card">
                  <div className="cri-other-thumb">
                    {p.images[0] ? (
                      <Image
                        src={`/media/${p.images[0].key}`}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="image-empty">
                        <Building size={32} />
                      </div>
                    )}
                    {hasTradeIn(p.tags) && (
                      <span className="trade-badge">
                        <Repeat size={11} strokeWidth={2.5} /> ACEITA PERMUTA
                      </span>
                    )}
                  </div>
                  <div className="cri-other-body">
                    <span className="cri-other-location">
                      {p.neighborhood.toUpperCase()} · {p.city.toUpperCase()}
                    </span>
                    <h4 className="cri-other-title">{p.title}</h4>
                    <strong className="cri-other-price">{priceLabel(p.price)}</strong>
                    <button
                      className="cri-other-link"
                      onClick={() => {
                        setSelected(p.id);
                        document.querySelector(".cri-hero-banner")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      Conhecer dentro do portfólio <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
