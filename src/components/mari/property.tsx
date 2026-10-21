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

export function isTradeInTag(t: { id?: string; key?: string | null; name?: string }) {
  return t.key === "trade_in" || Boolean(t.name && t.name.toLowerCase().includes("permuta"));
}

export function hasTradeIn(tags?: { id?: string; key?: string | null; name?: string }[]) {
  return Boolean(tags?.some(isTradeInTag));
}

export function whatsappLink(phone: string, property?: Listing) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `https://wa.me/${phone}?text=${encodeURIComponent(property ? `Olá, Mari! Tenho interesse no imóvel ${property.title}, referência ${property.code}. Gostaria de receber mais informações. ${origin}/imovel/${property.slug}` : "Olá, Mari! Gostaria de conversar sobre imóveis no litoral.")}`;
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
export function PropertyDetail({
  property: p,
  standalone = false,
}: {
  property: Listing;
  standalone?: boolean;
}) {
  const { content, client, select, contact } = useMari();
  const [copied, setCopied] = useState("");
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
            {p.type} · {purposes[p.purpose]} · Ref. {p.code}
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
          <dl className="characteristics">
            {p.bathrooms != null && <div><dt>Banheiros</dt><dd>{p.bathrooms}</dd></div>}
            {p.suites !== null && (
              <div>
                <dt>Suítes</dt>
                <dd>{p.suites}</dd>
              </div>
            )}
            {p.category && (
              <div>
                <dt>Categoria</dt>
                <dd>{p.category.name}</dd>
              </div>
            )}
            {p.situation && (
              <div>
                <dt>Situação</dt>
                <dd>{p.situation.name}</dd>
              </div>
            )}
            {p.values.map((v) => (
              <div key={v.fieldId}>
                <dt>{v.field.label}</dt>
                <dd>
                  {typeof v.value === "boolean"
                    ? v.value
                      ? "Sim"
                      : "Não"
                    : Array.isArray(v.value)
                      ? v.value.join(", ")
                      : String(v.value)}
                </dd>
              </div>
            ))}
          </dl>
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
          <p className="eyebrow">
            {p.purpose === "rent" ? "Valor mensal" : "Valor anunciado"}
          </p>
          <strong className="detail-price">{priceLabel(p.price)}</strong>
          <p>Converse com a Mari sobre condições e disponibilidade.</p>
          <a
            className="button full"
            href={whatsappLink(content.whatsapp, p)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conversar no WhatsApp <ArrowUpRight size={16} />
          </a>
          <button className="button secondary full" onClick={() => contact(p)}>
            Solicitar contato
          </button>
          <button className="text-button" onClick={() => select(p)}>
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
                  `${location.origin}/imovel/${p.slug}`,
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
