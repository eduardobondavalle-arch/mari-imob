"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Trash2, Star } from "lucide-react";
import { api, Busy, MediaUpload, Notice } from "./ui";
import { type Listing, type Field, statuses, purposes } from "@/lib/mari/types";
import { propertySchema } from "@/lib/mari/validation";
import type { z } from "zod";
export type SettingsData = {
  fields: Field[];
  tags: { id: string; name: string }[];
  taxonomies: { id: string; name: string; kind: string }[];
};
type FormValue = z.infer<typeof propertySchema>;
const blank: FormValue = {
  title: "",
  headline: "",
  purpose: "sale",
  type: "Apartamento",
  status: "draft",
  featured: false,
  superFeatured: false,
  price: null,
  condominiumFee: null,
  condominiumPeriod: null,
  iptuFee: null,
  iptuPeriod: null,
  trashFee: null,
  trashPeriod: null,
  otherFees: null,
  otherFeesPeriod: null,
  otherFeesDescription: "",
  city: "Balneário Camboriú",
  neighborhood: "",
  publicAddress: "",
  privateAddress: "",
  description: "",
  videoUrl: "",
  bedrooms: null,
  suites: null,
  bathrooms: null,
  parking: null,
  area: null,
  categoryId: null,
  situationId: null,
  tagIds: [],
  imageIds: [],
  customValues: {},
};
export function PropertyEditor({
  property,
  onCancel,
  onSaved,
}: {
  property: Listing | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [data, setData] = useState<FormValue>(() =>
    property
      ? ({
          ...blank,
          ...property,
          purpose: property.purpose as FormValue["purpose"],
          status: property.status as FormValue["status"],
          privateAddress: property.privateAddress || "",
          tagIds: property.tags.map((t) => t.id),
          imageIds: property.images.map((i) => i.id),
          customValues: Object.fromEntries(
            property.values.map((v) => [v.fieldId, v.value]),
          ),
        } as FormValue)
      : blank,
  );
  const [images, setImages] = useState(property?.images || []);
  const [config, setConfig] = useState<SettingsData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<SettingsData>("admin/settings")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  function set<K extends keyof FormValue>(key: K, value: FormValue[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = propertySchema.parse({
        ...data,
        imageIds: images.map((i) => i.id),
      });
      await api(
        `admin/properties${property ? `/${property.id}` : ""}`,
        payload,
        property ? "PUT" : "POST",
      );
      for (const original of property?.images || [])
        if (!images.some((i) => i.id === original.id))
          await api(`admin/media/${original.id}`, {}, "DELETE");
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, step: number) {
    setImages((items) => {
      const updated = [...items];
      const target = index + step;
      if (target < 0 || target >= updated.length) return items;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  }
  if (!config)
    return (
      <>
        <Busy />
        <Notice error>{error}</Notice>
      </>
    );
  return (
    <form onSubmit={submit} className="property-editor">
      <button type="button" className="back-link" onClick={onCancel}>
        <ArrowLeft size={16} /> Voltar ao catálogo
      </button>
      <section className="admin-card">
        <h2>Apresentação do imóvel</h2>
        <div className="form-grid">
          <label className="span-2">
            Título do anúncio
            <input
              required
              minLength={5}
              maxLength={180}
              value={data.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>
          <label className="span-2">
            Frase de destaque
            <input
              maxLength={220}
              value={data.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
          </label>
          <label>
            Finalidade
            <select
              value={data.purpose}
              onChange={(e) =>
                set("purpose", e.target.value as FormValue["purpose"])
              }
            >
              {Object.entries(purposes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo do imóvel
            <input
              required
              list="property-types"
              value={data.type}
              onChange={(e) => set("type", e.target.value)}
            />
            <datalist id="property-types">
              {["Apartamento", "Casa", "Cobertura", "Terreno", "Comercial"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </datalist>
          </label>
          <label>
            Categoria
            <select
              value={data.categoryId || ""}
              onChange={(e) => set("categoryId", e.target.value || null)}
            >
              <option value="">Não informada</option>
              {config.taxonomies
                .filter((t) => t.kind === "category")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Situação
            <select
              value={data.situationId || ""}
              onChange={(e) => set("situationId", e.target.value || null)}
            >
              <option value="">Não informada</option>
              {config.taxonomies
                .filter((t) => t.kind === "situation")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Valor do anúncio (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.price ?? ""}
              placeholder="Vazio = sob consulta"
              onChange={(e) =>
                set(
                  "price",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </label>
          <label>
            Status
            <select
              value={data.status}
              onChange={(e) =>
                set("status", e.target.value as FormValue["status"])
              }
            >
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="check-line">
            <input
              type="checkbox"
              checked={data.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            <span>Destacar na página inicial</span>
          </label>
          <label className="check-line">
            <input type="checkbox" checked={data.superFeatured} onChange={(e) => set("superFeatured", e.target.checked)} />
            <span>Super Destaque</span>
          </label>
        </div>
      </section>
      {data.purpose === "rent" && <section className="admin-card">
        <h2>Despesas da locação</h2>
        <div className="form-grid">
          {([['condominiumFee','condominiumPeriod','Condomínio'],['iptuFee','iptuPeriod','IPTU'],['trashFee','trashPeriod','Taxa de lixo'],['otherFees','otherFeesPeriod','Outras taxas']] as const).map(([valueKey, periodKey, label]) => <div className="expense-field" key={valueKey}><label>{label}<input type="number" min="0" step="0.01" value={data[valueKey] ?? ""} onChange={(e)=>set(valueKey,e.target.value===""?null:Number(e.target.value))}/></label><label>Periodicidade<select value={data[periodKey] || ""} onChange={(e)=>set(periodKey,(e.target.value || null) as FormValue[typeof periodKey])}><option value="">Não informada</option><option value="monthly">Mensal</option><option value="annual">Anual</option></select></label></div>)}
          <label className="span-2">Descrição das outras taxas<input value={data.otherFeesDescription} onChange={(e)=>set("otherFeesDescription",e.target.value)}/></label>
        </div>
      </section>}
      <section className="admin-card">
        <h2>Localização e características</h2>
        <div className="form-grid">
          <label>
            Cidade
            <input
              required
              value={data.city}
              list="property-cities"
              onChange={(e) => set("city", e.target.value)}
            />
            <datalist id="property-cities"><option>Balneário Camboriú</option><option>Camboriú</option><option>Itajaí</option></datalist>
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
            Localização pública
            <input
              value={data.publicAddress}
              onChange={(e) => set("publicAddress", e.target.value)}
              placeholder="Ex.: Avenida Atlântica, Centro"
            />
          </label>
          <label className="span-2">
            Endereço completo (somente administração)
            <input
              value={data.privateAddress}
              onChange={(e) => set("privateAddress", e.target.value)}
            />
          </label>
          {(
            [
              ["bedrooms", "Quartos"],
              ["suites", "Suítes"],
              ["bathrooms", "Banheiros"],
              ["parking", "Vagas"],
              ["area", "Área privativa (m²)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min="0"
                step={key === "area" ? ".01" : "1"}
                value={data[key] ?? ""}
                onChange={(e) =>
                  set(
                    key,
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </label>
          ))}
        </div>
      </section>
      <section className="admin-card">
        <h2>Descrição e detalhes</h2>
        <div className="stack">
          <label>
            Descrição do anúncio
            <textarea
              required
              minLength={10}
              rows={7}
              maxLength={20000}
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label>
            Link para vídeo (HTTPS)
            <input
              type="url"
              value={data.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              placeholder="https://…"
            />
          </label>
          <fieldset>
            <legend>Tags do imóvel</legend>
            <div className="checkbox-group">
              {config.tags.map((t) => (
                <label className="check-line" key={t.id}>
                  <input
                    type="checkbox"
                    checked={data.tagIds.includes(t.id)}
                    onChange={(e) =>
                      set(
                        "tagIds",
                        e.target.checked
                          ? [...data.tagIds, t.id]
                          : data.tagIds.filter((id) => id !== t.id),
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>
      <section className="admin-card">
        <h2>Galeria de fotos</h2>
        <p>
          A primeira foto será a imagem principal. Use as setas para
          reorganizar.
        </p>
        <div className="image-editor-grid">
          {images.map((image, index) => (
            <div key={image.id} className="image-editor-item">
              <Image
                src={`/media/${image.key}`}
                unoptimized
                alt={image.alt}
                width={260}
                height={180}
              />
              <div>
                {index === 0 && (
                  <span>
                    <Star size={13} /> Principal
                  </span>
                )}
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Mover foto ${index + 1} para esquerda`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Mover foto ${index + 1} para direita`}
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button danger-text"
                  aria-label={`Remover foto ${index + 1}`}
                  onClick={() =>
                    setImages((items) => items.filter((i) => i.id !== image.id))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <MediaUpload
          multiple
          onUploaded={(image) => setImages((items) => [...items, image])}
        />
      </section>
      {config.fields.length > 0 && (
        <section className="admin-card">
          <h2>Informações personalizadas</h2>
          <div className="form-grid">
            {config.fields.map((field) => (
              <DynamicInput
                key={field.id}
                field={field}
                value={data.customValues[field.id]}
                onChange={(value) =>
                  set("customValues", {
                    ...data.customValues,
                    [field.id]: value,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
      <div className="editor-save-bar">
        <Notice error>{error}</Notice>
        <div className="button-row">
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Salvando…" : "Salvar imóvel"}
          </button>
        </div>
      </div>
    </form>
  );
}
export function DynamicInput({
  field: f,
  value,
  onChange,
}: {
  field: Field;
  value: FormValue["customValues"][string] | undefined;
  onChange: (value: FormValue["customValues"][string]) => void;
}) {
  const label = `${f.label}${f.required ? " *" : ""}`;
  if (f.type === "multiselect")
    return (
      <fieldset>
        <legend>{label}</legend>
        {f.options.map((o) => (
          <label className="check-line" key={o.id}>
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(o.value)}
              onChange={(e) => {
                const values = Array.isArray(value) ? value : [];
                onChange(
                  e.target.checked
                    ? [...values, o.value]
                    : values.filter((v) => v !== o.value),
                );
              }}
            />
            {o.value}
          </label>
        ))}
      </fieldset>
    );
  return (
    <label>
      {label}
      {f.type === "boolean" || f.type === "select" ? (
        <select
          required={f.required}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) =>
            onChange(
              e.target.value === ""
                ? null
                : f.type === "boolean"
                  ? e.target.value === "true"
                  : e.target.value,
            )
          }
        >
          <option value="">Selecione</option>
          {f.type === "boolean" ? (
            <>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </>
          ) : (
            f.options.map((o) => (
              <option value={o.value} key={o.id}>
                {o.value}
              </option>
            ))
          )}
        </select>
      ) : f.type === "textarea" ? (
        <textarea
          required={f.required}
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input
          required={f.required}
          type={
            ["number", "money"].includes(f.type)
              ? "number"
              : f.type === "date"
                ? "date"
                : "text"
          }
          step="any"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) =>
            onChange(
              e.target.value === ""
                ? null
                : ["number", "money"].includes(f.type)
                  ? Number(e.target.value)
                  : e.target.value,
            )
          }
        />
      )}
    </label>
  );
}
