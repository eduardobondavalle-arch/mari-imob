"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  BedDouble,
  CarFront,
  Ruler,
  ArrowLeft,
  Share2,
  Building2,
  Repeat,
} from "lucide-react";
import { PropertyGallery } from "@/components/gallery";
import { type Listing, purposes, priceLabel } from "@/lib/mari/types";
import { useMari } from "./provider";
import { Modal, Notice } from "./ui";
import { PropertyCharacteristics } from "./property-characteristics";

export function isTradeInTag(t: { id?: string; key?: string | null; name?: string }) {
  return t.key === "trade_in" || Boolean(t.name && t.name.toLowerCase().includes("permuta"));
}

export function hasTradeIn(tags?: { id?: string; key?: string | null; name?: string }[]) {
  return Boolean(tags?.some(isTradeInTag));
}

export function whatsappLink(phone: string, property?: Listing, purpose = property?.purpose, origin = "") {
  const context = purpose === "rent" ? "para locação" : purpose === "season" ? "para temporada" : "para compra";
  const message = property
    ? `Olá, Mari! Tenho interesse no imóvel ${property.title}, referência ${property.code}, ${context}. Gostaria de receber mais informações. ${origin}/imovel/${property.slug}?purpose=${purpose}`
    : "Olá, Mari! Gostaria de conversar sobre imóveis no litoral.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}function RentalCosts({ property }: { property: Listing }) {
  const rows = [
    ["Condomínio", property.condominiumFee, property.condominiumPeriod],
    ["IPTU", property.iptuFee, property.iptuPeriod],
    ["Taxa de lixo", property.trashFee, property.trashPeriod],
    [property.otherFeesDescription || "Outras taxas", property.otherFees, property.otherFeesPeriod],
  ] as const;
  const monthly = rows.filter(([, value, period]) => value != null && period === "monthly");
  const total = (property.price || 0) + monthly.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const partial = rows.some(([, value, period]) => value == null || period !== "monthly");
  const periodLabel = (period: string | null | undefined) => period === "annual" ? "/ano" : period === "monthly" ? "/mês" : " · periodicidade não informada";
  return <div className="rental-costs"><div><span>Aluguel</span><strong>{priceLabel(property.price)}/mês</strong></div>{rows.filter(([,value])=>value!=null).map(([label,value,period])=><div key={label}><span>{label}</span><strong>{priceLabel(Number(value))}{periodLabel(period)}</strong></div>)}<div className="rental-total"><span>Total mensal {partial ? "estimado" : ""}</span><strong>{priceLabel(total)}</strong></div>{partial && <small>Total parcial: despesas não informadas ou sem periodicidade mensal não foram somadas.</small>}</div>;
}
export function PropertyGrid({ items }: { items: Listing[] }) {
  const [active, setActive] = useState<Listing | null>(null);
  const previousUrl = useRef("");
  useEffect(() => {
    const listener = () => setActive(null);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  function open(p: Listing) {
    previousUrl.current = location.href;
    window.history.pushState(
      { ...window.history.state, mariPreview: true },
      "",
      `/imovel/${p.slug}`,
    );
    setActive(p);
  }
  function close() {
    if (window.history.state?.mariPreview) window.history.back();
    else {
      if (previousUrl.current)
        window.history.replaceState(
          window.history.state,
          "",
          previousUrl.current,
        );
      setActive(null);
    }
  }
  return (
    <>
      <div className="property-grid">
        {items.map((p) => (
          <PropertyCard key={p.id} property={p} onOpen={() => open(p)} />
        ))}
      </div>
      {active && (
        <Modal title="Conheça este imóvel" wide onClose={close}>
          <PropertyDetail property={active} />
        </Modal>
      )}
    </>
  );
}
export function PropertyCard({
  property: p,
  onOpen,
}: {
  property: Listing;
  onOpen?: () => void;
}) {
  const { client, select } = useMari();
  const image = p.images[0];
  const [busy, setBusy] = useState(false);
  const selected = client?.items.some((i) => i.id === p.id);
  function intercept(e: React.MouseEvent) {
    if (onOpen && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      onOpen();
    }
  }
  return (
    <article className="listing-card">
      <div className="listing-image">
        <Link
          href={`/imovel/${p.slug}`}
          onClick={intercept}
          aria-label={`Conhecer ${p.title}`}
        >
          {image ? (
            <Image
              src={`/media/${image.key}`}
              alt={image.alt || p.title}
              fill
              sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
            />
          ) : (
            <div className="image-empty">
              <Building2 size={36} />
              <span>Fotos em breve</span>
            </div>
          )}
        </Link>
        <span className="listing-purpose">{purposes[p.purpose]}</span>
        <button
          className={`save-button ${selected ? "is-saved" : ""}`}
          aria-label={
            selected
              ? `Remover ${p.code} da seleção`
              : `Adicionar ${p.code} à seleção`
          }
          aria-pressed={Boolean(selected)}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await select(p);
            setBusy(false);
          }}
        >
          <Heart size={19} fill={selected ? "currentColor" : "none"} />
        </button>
        {hasTradeIn(p.tags) && (
          <span className="trade-badge" title="Este imóvel aceita permuta">
            <Repeat size={12} strokeWidth={2.5} className="trade-icon" /> ACEITA PERMUTA
          </span>
        )}
        {p.tags.find((t) => !isTradeInTag(t)) && (
          <span className="listing-tag">{p.tags.find((t) => !isTradeInTag(t))!.name}</span>
        )}
      </div>
      <div className="listing-body">
        <p className="eyebrow">
          <MapPin size={12} />
          {p.neighborhood} · {p.city}
        </p>
        <h3>
          <Link href={`/imovel/${p.slug}`} onClick={intercept}>
            {p.title}
          </Link>
        </h3>
        <Features property={p} />
        <div className="listing-bottom">
          <div>
            <small>
              {p.purpose === "rent" ? "Locação mensal" : "Valor do imóvel"}
            </small>
            <strong>{priceLabel(p.price)}</strong>
          </div>
          <Link
            href={`/imovel/${p.slug}`}
            onClick={intercept}
            className="arrow-link"
            aria-label={`Ver imóvel ${p.code}`}
          >
            <ArrowUpRight size={22} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Features({ property: p }: { property: Listing }) {
  return (
    <div className="features">
      {p.bedrooms !== null && (
        <span>
          <BedDouble size={16} />
          {p.bedrooms} quartos
        </span>
      )}
      {p.parking !== null && (
        <span>
          <CarFront size={16} />
          {p.parking} vagas
        </span>
      )}
      {p.area !== null && (
        <span>
          <Ruler size={16} />
          {p.area} m²
        </span>
      )}
    </div>
  );
}
function CondominiumDetails({ property }: { property: Listing }) {
  const condominium = property.condominium;
  if (!condominium) return null;
  return <section className="property-condominium" aria-labelledby="condominium-title">
    <p className="eyebrow">CONDOMÍNIO / EMPREENDIMENTO</p>
    <h2 id="condominium-title">Sobre o condomínio</h2>
    <h3>{condominium.name}</h3>
    <p className="location"><MapPin size={16}/>{condominium.neighborhood}, {condominium.city}</p>
    {condominium.description && <p className="pre-line">{condominium.description}</p>}
    {condominium.amenities.length > 0 && <div className="condominium-amenities" aria-label="Estrutura do condomínio">{condominium.amenities.map((amenity) => <span key={amenity}><Building2 size={15}/>{amenity}</span>)}</div>}
    {condominium.images.length > 0 && <div className="condominium-gallery">{condominium.images.map((image) => <Image key={image.id} src={`/media/${image.key}`} unoptimized width={480} height={320} alt={image.alt || `${condominium.name} - área comum`}/>)}</div>}
  </section>;
}
export function PropertyDetail({
  property: p,
  standalone = false,
}: {
  property: Listing;
  standalone?: boolean;
}) {
  const { content, client, select, contact } = useMari();
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");
  const availableOffers = p.offers.filter((offer) => offer.active);
  const [selectedPurpose, setSelectedPurpose] = useState(p.purpose);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("purpose");
    if (!requested || !p.offers.some((offer) => offer.active && offer.purpose === requested)) return;
    const timer = window.setTimeout(() => setSelectedPurpose(requested), 0);
    return () => window.clearTimeout(timer);
  }, [p.offers]);
  useEffect(() => {
    const timer = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const selectedOffer = availableOffers.find((offer) => offer.purpose === selectedPurpose) || availableOffers[0];
  const activeProperty = { ...p, purpose: selectedOffer?.purpose || p.purpose, price: selectedOffer?.price ?? p.price };
  return (
    <div className="property-detail">
      {standalone && (
        <Link className="back-link" href="/buscar">
          <ArrowLeft size={16} /> Explorar imóveis
        </Link>
      )}
      <PropertyGallery
        title={p.title}
        media={p.images.map((i) => ({
          id: i.id,
          type: "image" as const,
          url: `/media/${i.key}`,
          alt: i.alt || p.title,
          source: "upload",
          width: i.width,
          height: i.height,
        }))}
      />
      <div className="detail-grid">
        <div>
          <p className="eyebrow">
            {p.type} · {purposes[activeProperty.purpose]} · Ref. {p.code}
          </p>
          <h1>{p.title}</h1>
          {p.headline && <p className="detail-headline">{p.headline}</p>}
          <p className="location">
            <MapPin size={17} />
            {p.publicAddress || `${p.neighborhood}, ${p.city} · SC`}
          </p>
          <Features property={p} />
          {hasTradeIn(p.tags) && (
            <div className="trade-notice-card">
              <span className="trade-badge-sm">
                <Repeat size={13} strokeWidth={2.5} className="trade-icon" /> ACEITA PERMUTA
              </span>
              <div>
                <strong>Este imóvel aceita permuta</strong>
                <p>
                  O proprietário estuda permuta como parte do pagamento. Fale com a Mari para avaliar as condições da negociação.
                </p>
              </div>
            </div>
          )}
          <div className="tag-list">
            {p.tags
              .filter((t) => !isTradeInTag(t))
              .map((t) => (
                <span key={t.id}>{t.name}</span>
              ))}
          </div>
          <h2>Um pouco mais sobre este lugar</h2>
          <p className="pre-line">{p.description}</p>
          <PropertyCharacteristics property={p} />
          <CondominiumDetails property={p} />
          {p.videoUrl && (
            <a
              className="button secondary"
              href={p.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Assistir ao vídeo <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <aside className="price-panel">
          {availableOffers.length > 1 && <div className="offer-selector" role="group" aria-label="Finalidade do imóvel">
            {availableOffers.map((offer) => <button type="button" key={offer.purpose} className={activeProperty.purpose === offer.purpose ? "active" : ""} onClick={() => setSelectedPurpose(offer.purpose)}>{purposes[offer.purpose]}</button>)}
          </div>}
          <p className="eyebrow">
            {activeProperty.purpose === "rent" ? "Valor mensal" : activeProperty.purpose === "season" ? "Valor da temporada" : "Valor anunciado"}
          </p>
          <strong className="detail-price">{priceLabel(activeProperty.price)}</strong>
          {(activeProperty.purpose === "rent" || activeProperty.purpose === "season") && <RentalCosts property={activeProperty}/>}
          <p>Converse com a Mari sobre condições e disponibilidade.</p>
          <a
            className="button full"
            href={whatsappLink(content.whatsapp, activeProperty, activeProperty.purpose, origin)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conversar no WhatsApp <ArrowUpRight size={16} />
          </a>
          <button className="button secondary full" onClick={() => contact(activeProperty)}>
            Solicitar contato
          </button>
          <button className="text-button" onClick={() => select(activeProperty)}>
            <Heart size={17} />
            {client?.items.some((i) => i.id === p.id)
              ? "Remover da seleção"
              : "Adicionar à Minha Seleção"}
          </button>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.origin}/imovel/${p.slug}?purpose=${activeProperty.purpose}`,
                );
                setCopied("Link copiado.");
              } catch {
                setCopied(`${location.origin}/imovel/${p.slug}`);
              }
            }}
          >
            <Share2 size={16} /> Compartilhar imóvel
          </button>
          <Notice>{copied}</Notice>
        </aside>
      </div>
    </div>
  );
}
