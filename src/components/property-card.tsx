"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BedDouble,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageOff,
  MapPin,
} from "lucide-react";
import type { Property } from "@/domain/property";
import { money } from "@/lib/format";
export function PropertyCard({ property: p }: { property: Property }) {
  const [index, setIndex] = useState(0),
    [broken, setBroken] = useState(false);
  const media = p.media.filter((m) => m.type === "image");
  const photo = media[index];
  const move = (step: number) => {
    setIndex((index + step + media.length) % media.length);
    setBroken(false);
  };
  return (
    <article className="property-card">
      <div className="card-image">
        <Link
          href={`/imovel/${p.slug}`}
          className="card-image-link"
          aria-label={`Conhecer ${p.title}`}
        >
          {photo && !broken ? (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="image-placeholder">
              <ImageOff size={30} />
              Imagens em breve
            </span>
          )}
        </Link>
        {p.isDemo && <span className="demo-tag">ILUSTRATIVO</span>}
        {p.badge && <span className="property-tag">{p.badge}</span>}
        {media.length > 1 && (
          <>
            <button
              className="photo-arrow previous"
              onClick={() => move(-1)}
              aria-label={`Foto anterior de ${p.code}`}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="photo-arrow next"
              onClick={() => move(1)}
              aria-label={`Próxima foto de ${p.code}`}
            >
              <ChevronRight size={17} />
            </button>
            <span className="photo-count" aria-live="polite">
              {index + 1} / {media.length}
            </span>
          </>
        )}
      </div>
      <div className="card-content">
        <div className="card-location">
          <MapPin size={13} />
          {p.location.neighborhoodName} · {p.location.cityName}
        </div>
        <h3>
          <Link href={`/imovel/${p.slug}`}>{p.title}</Link>
        </h3>
        <span className="property-code">Cód. {p.code}</span>
        <div className="card-features">
          {p.bedrooms !== null && (
            <span>
              <BedDouble size={16} />
              {p.bedrooms} quartos
            </span>
          )}
          {p.parking !== null && (
            <span>
              <CarFront size={16} />
              {p.parking} {p.parking === 1 ? "vaga" : "vagas"}
            </span>
          )}
          {p.area !== null && (
            <span>
              <Expand size={15} />
              {p.area} m²
            </span>
          )}
        </div>
        {p.suites !== null && (
          <span className="suites-caption">
            {p.suites} {p.suites === 1 ? "suíte" : "suítes"}
          </span>
        )}
        <div className="card-bottom">
          <div>
            <span className="rent-label">Aluguel mensal</span>
            <strong>
              {money(p.costs.rent)}
              <small>{p.costs.rent !== null ? "/mês" : ""}</small>
            </strong>
          </div>
          <Link
            href={`/imovel/${p.slug}`}
            className="card-cta"
            aria-label={`Ver imóvel ${p.code}`}
          >
            <ArrowUpRight size={21} />
          </Link>
        </div>
        <p className="card-cost-note">
          Condomínio e IPTU no detalhe do imóvel.
        </p>
      </div>
    </article>
  );
}
