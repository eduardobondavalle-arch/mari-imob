"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Archive,
  Building2,
  ExternalLink,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { api, Busy, Modal, Notice } from "./ui";
import { SortableMediaGallery } from "./sortable-media-gallery";
import type { CondominiumSummary, MediaItem } from "@/lib/mari/types";

export const condominiumAmenities = [
  "Piscina",
  "Piscina aquecida",
  "Academia",
  "Sauna",
  "Salão de festas",
  "Espaço gourmet",
  "Churrasqueira",
  "Playground",
  "Brinquedoteca",
  "Sala de jogos",
  "Quadra esportiva",
  "Quadra de tênis",
  "Espaço pet",
  "Coworking",
  "Cinema",
  "Spa",
  "Portaria 24 horas",
  "Segurança 24 horas",
  "Elevador",
  "Bicicletário",
];

type FormData = Omit<CondominiumSummary, "id" | "images" | "propertyCount"> & {
  imageIds: string[];
};
const blank: FormData = {
  name: "",
  city: "Balneário Camboriú",
  neighborhood: "",
  street: "",
  number: "",
  complement: "",
  postalCode: "",
  description: "",
  amenities: [],
  archived: false,
  imageIds: [],
};

export function CondominiumEditor({
  condominium,
  onCancel,
  onSaved,
  embedded = false,
}: {
  condominium: CondominiumSummary | null;
  onCancel: () => void;
  onSaved: (saved: CondominiumSummary) => void | Promise<void>;
  embedded?: boolean;
}) {
  const [data, setData] = useState<FormData>(() =>
    condominium
      ? {
          ...blank,
          ...condominium,
          imageIds: condominium.images.map((image) => image.id),
        }
      : blank,
  );
  const [images, setImages] = useState<MediaItem[]>(condominium?.images || []);
  const [customAmenity, setCustomAmenity] = useState("");
  const [similar, setSimilar] = useState<CondominiumSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const newIds = useRef(new Set<string>());
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (condominium || data.name.trim().length < 3) return;
    const timer = window.setTimeout(
      () =>
        api<CondominiumSummary[]>(
          `admin/condominiums?q=${encodeURIComponent(data.name)}`,
        )
          .then((rows) => setSimilar(rows.slice(0, 4)))
          .catch(() => setSimilar([])),
      220,
    );
    return () => window.clearTimeout(timer);
  }, [condominium, data.name]);
  async function cancel() {
    setBusy(true);
    await Promise.allSettled(
      [...newIds.current].map((id) => api(`admin/media/${id}`, {}, "DELETE")),
    );
    onCancel();
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const saved = await api<CondominiumSummary>(
        `admin/condominiums${condominium ? `/${condominium.id}` : ""}`,
        { ...data, imageIds: images.map((image) => image.id) },
        condominium ? "PUT" : "POST",
      );
      newIds.current.clear();
      for (const original of condominium?.images || [])
        if (!images.some((image) => image.id === original.id))
          await api(`admin/media/${original.id}`, {}, "DELETE");
      await onSaved(saved);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const content = (
    <>
      {!embedded && (
        <button type="button" className="back-link" onClick={cancel}>
          ← Voltar aos condomínios
        </button>
      )}
      <section className="admin-card">
        <h2>Informações do condomínio</h2>
        <div className="form-grid">
          <label className="span-2">
            Nome do condomínio
            <input
              required
              minLength={2}
              maxLength={140}
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          {!condominium &&
            data.name.trim().length >= 3 &&
            similar.length > 0 && (
              <div className="span-2 duplicate-suggestions">
                <strong>Cadastros semelhantes encontrados</strong>
                {similar.map((item) => (
                  <span key={item.id}>
                    {item.name} · {item.street}, {item.number} ·{" "}
                    {item.neighborhood}
                  </span>
                ))}
              </div>
            )}
          <label>
            Cidade
            <input
              required
              value={data.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </label>
          <label>
            Bairro
            <input
              required
              value={data.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
            />
          </label>
          <label className="span-2">
            Rua
            <input
              required
              value={data.street}
              onChange={(e) => set("street", e.target.value)}
            />
          </label>
          <label>
            Número
            <input
              required
              value={data.number}
              onChange={(e) => set("number", e.target.value)}
            />
          </label>
          <label>
            Complemento
            <input
              value={data.complement}
              onChange={(e) => set("complement", e.target.value)}
            />
          </label>
          <label>
            CEP
            <input
              inputMode="numeric"
              placeholder="00000-000"
              value={data.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
            />
          </label>
          <label className="span-2">
            Descrição
            <textarea
              rows={5}
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
        </div>
      </section>
      <section className="admin-card">
        <h2>Estrutura e lazer do condomínio</h2>
        <div className="amenity-grid">
          {[...new Set([...condominiumAmenities, ...data.amenities])].map(
            (amenity) => (
              <label className="check-line" key={amenity}>
                <input
                  type="checkbox"
                  checked={data.amenities.includes(amenity)}
                  onChange={(e) =>
                    set(
                      "amenities",
                      e.target.checked
                        ? [...data.amenities, amenity]
                        : data.amenities.filter((item) => item !== amenity),
                    )
                  }
                />
                {amenity}
              </label>
            ),
          )}
        </div>
        <div className="inline-create">
          <input
            aria-label="Nova característica"
            placeholder="Adicionar outra característica"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
          />
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              const value = customAmenity.trim();
              if (value && !data.amenities.includes(value))
                set("amenities", [...data.amenities, value]);
              setCustomAmenity("");
            }}
          >
            Adicionar
          </button>
        </div>
      </section>
      <section className="admin-card">
        <h2>Galeria de áreas comuns</h2>
        <SortableMediaGallery
          images={images}
          setImages={setImages}
          onUploaded={(image) => {
            newIds.current.add(image.id);
            setImages((items) => [...items, image]);
          }}
          onRemove={async (image) => {
            setImages((items) => items.filter((item) => item.id !== image.id));
            if (newIds.current.delete(image.id))
              await api(`admin/media/${image.id}`, {}, "DELETE");
          }}
        />
      </section>
      <Notice error>{error}</Notice>
      <div className="editor-save-bar">
        <div className="button-row">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={cancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button"
            disabled={
              busy ||
              !data.name ||
              !data.neighborhood ||
              !data.street ||
              !data.number
            }
            onClick={save}
          >
            {busy ? "Salvando…" : "Salvar condomínio"}
          </button>
        </div>
      </div>
    </>
  );
  return <div className="property-editor condominium-editor">{content}</div>;
}

export function CondominiumAdmin() {
  const [items, setItems] = useState<CondominiumSummary[]>([]);
  const [viewing, setViewing] = useState<CondominiumSummary | null>(null);
  const [editing, setEditing] = useState<CondominiumSummary | "new" | null>(
    null,
  );
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(
        await api(
          `admin/condominiums?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&neighborhood=${encodeURIComponent(neighborhood)}`,
        ),
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }, [q, city, neighborhood]);
  useEffect(() => {
    const timer = window.setTimeout(load, 180);
    return () => window.clearTimeout(timer);
  }, [load]);
  if (editing)
    return (
      <CondominiumEditor
        condominium={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await load();
        }}
      />
    );
  const cities = [...new Set(items.map((item) => item.city))];
  const neighborhoods = [...new Set(items.map((item) => item.neighborhood))];
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">CATÁLOGO</p>
          <h1>Condomínios</h1>
          <p>Centralize endereços, lazer e fotografias das áreas comuns.</p>
        </div>
        <button className="button" onClick={() => setEditing("new")}>
          <Plus size={16} /> Novo condomínio
        </button>
      </div>
      <div className="admin-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar condomínios"
            placeholder="Buscar por nome ou endereço"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">Todas as cidades</option>
          {cities.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar bairro"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        >
          <option value="">Todos os bairros</option>
          {neighborhoods.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      {busy ? (
        <Busy />
      ) : (
        <div className="admin-card condominium-list">
          {items.map((item) => (
            <article key={item.id} className="condominium-row">
              {item.images[0] ? (
                <Image
                  src={`/media/${item.images[0].key}`}
                  unoptimized
                  width={130}
                  height={90}
                  alt={item.images[0].alt}
                />
              ) : (
                <span className="condominium-placeholder">
                  <Building2 />
                </span>
              )}
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.neighborhood}, {item.city}
                </small>
                <span>
                  {item.street}, {item.number}
                </span>
                <span>
                  {item.propertyCount || 0}{" "}
                  {(item.propertyCount || 0) === 1
                    ? "imóvel vinculado"
                    : "imóveis vinculados"}
                </span>
              </div>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Editar ${item.name}`}
                  onClick={() => setEditing(item)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Visualizar ${item.name}`}
                  onClick={() => setViewing(item)}
                >
                  <ExternalLink size={17} />
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label={`Arquivar ${item.name}`}
                  onClick={async () => {
                    if (
                      !confirm(
                        item.propertyCount
                          ? "Arquivar e desvincular os imóveis deste condomínio?"
                          : "Arquivar este condomínio?",
                      )
                    )
                      return;
                    try {
                      await api(
                        `admin/condominiums/${item.id}?unlink=${Boolean(item.propertyCount)}`,
                        {},
                        "DELETE",
                      );
                      await load();
                    } catch (cause) {
                      setError((cause as Error).message);
                    }
                  }}
                >
                  <Archive size={17} />
                </button>
              </div>
            </article>
          ))}
          {!items.length && (
            <div className="empty-admin">Nenhum condomínio encontrado.</div>
          )}
        </div>
      )}
      <Notice error>{error}</Notice>
      {viewing && (
        <Modal title={viewing.name} wide onClose={() => setViewing(null)}>
          <div className="modal-content condominium-preview">
            <p>
              <strong>
                {viewing.neighborhood}, {viewing.city}
              </strong>
              <br />
              {viewing.street}, {viewing.number}
              {viewing.complement ? ` - ${viewing.complement}` : ""}
            </p>
            {viewing.description && <p>{viewing.description}</p>}
            <div className="condominium-preview-amenities">
              {viewing.amenities.map((amenity) => (
                <span key={amenity}>{amenity}</span>
              ))}
            </div>
            {viewing.images.length > 0 && (
              <div className="condominium-preview-gallery">
                {viewing.images.map((image) => (
                  <Image
                    key={image.id}
                    src={`/media/${image.key}`}
                    unoptimized
                    width={360}
                    height={240}
                    alt={image.alt}
                  />
                ))}
              </div>
            )}
            <p>{viewing.propertyCount || 0} imóveis vinculados</p>
          </div>
        </Modal>
      )}
    </>
  );
}
