"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Grid2X2, ImageOff, X } from "lucide-react";
import type { PropertyMedia } from "@/domain/property";
export function PropertyGallery({
  media,
  title,
}: {
  media: PropertyMedia[];
  title: string;
}) {
  const photos = media.filter((m) => m.type === "image"),
    [index, setIndex] = useState(0),
    [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const move = (step: number) =>
    setIndex((i) => (i + step + photos.length) % photos.length);
  if (!photos.length)
    return (
      <div className="gallery-empty">
        <ImageOff size={42} />
        <p>Fotos deste imóvel em breve.</p>
      </div>
    );
  return (
    <>
      <div className="property-gallery">
        {photos.slice(0, 3).map((m, i) => (
          <button
            key={m.id}
            className={`gallery-tile tile-${i}`}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            aria-label={`Ampliar foto ${i + 1} de ${title}`}
          >
            <SafeGalleryImage
              media={m}
              preload={i === 0}
              sizes={
                i === 0
                  ? "(max-width: 700px) 100vw, 66vw"
                  : "(max-width: 700px) 50vw, 33vw"
              }
            />
            {i === 2 && (
              <span className="gallery-view">
                <Grid2X2 size={16} /> Ver {photos.length} fotos
              </span>
            )}
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="lightbox"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
        aria-label={`Galeria de ${title}`}
      >
        <div className="lightbox-heading">
          <span aria-live="polite">
            {index + 1} de {photos.length}
          </span>
          <button
            aria-label="Fechar galeria"
            className="icon-button"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="lightbox-image">
          <SafeGalleryImage
            key={photos[index].id}
            media={photos[index]}
            sizes="100vw"
          />
        </div>
        {photos.length > 1 && (
          <div className="lightbox-controls">
            <button
              className="icon-button"
              aria-label="Foto anterior"
              onClick={() => move(-1)}
            >
              <ArrowLeft />
            </button>
            <div className="thumbnails">
              {photos.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para foto ${i + 1}`}
                  aria-pressed={index === i}
                >
                  <Image src={m.url} alt="" width={80} height={55} />
                </button>
              ))}
            </div>
            <button
              className="icon-button"
              aria-label="Próxima foto"
              onClick={() => move(1)}
            >
              <ArrowRight />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
function SafeGalleryImage({
  media,
  preload = false,
  sizes,
}: {
  media: PropertyMedia;
  preload?: boolean;
  sizes: string;
}) {
  const [error, setError] = useState(false);
  return error ? (
    <span className="image-placeholder">
      <ImageOff />
      Não foi possível carregar a imagem.
    </span>
  ) : (
    <Image
      src={media.url}
      alt={media.alt}
      fill
      sizes={sizes}
      preload={preload}
      onError={() => setError(true)}
    />
  );
}
