"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api, Busy, Modal, Notice } from "./ui";
import { SortableMediaGallery } from "./sortable-media-gallery";
import { CondominiumEditor } from "./condominium-admin";
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
  offers: [{ purpose: "sale", price: null, active: true }],
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
  builtArea: null,
  landArea: null,
  condominiumId: null,
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
          offers: property.offers.length
            ? property.offers
            : [
                {
                  purpose: property.purpose as "sale" | "rent" | "season",
                  price: property.price,
                  active: true,
                },
              ],
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
  const [condominiums, setCondominiums] = useState<
    import("@/lib/mari/types").CondominiumSummary[]
  >([]);
  const [condominiumQuery, setCondominiumQuery] = useState(
    property?.condominium?.name || "",
  );
  const [creatingCondominium, setCreatingCondominium] = useState(false);
  const newImageIds = useRef(new Set<string>());
  useEffect(() => {
    api<SettingsData>("admin/settings")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        api<import("@/lib/mari/types").CondominiumSummary[]>(
          `admin/condominiums?q=${encodeURIComponent(condominiumQuery)}`,
        )
          .then(setCondominiums)
          .catch((e) => setError(e.message)),
      180,
    );
    return () => window.clearTimeout(timer);
  }, [condominiumQuery]);
  function set<K extends keyof FormValue>(key: K, value: FormValue[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function toggleOffer(purpose: "sale" | "rent" | "season", enabled: boolean) {
    const current = data.offers || [];
    const offers = enabled
      ? current.some((offer) => offer.purpose === purpose)
        ? current.map((offer) =>
            offer.purpose === purpose ? { ...offer, active: true } : offer,
          )
        : [...current, { purpose, price: null, active: true }]
      : current.filter((offer) => offer.purpose !== purpose);
    if (offers.length) set("offers", offers);
  }
  function setOfferPrice(
    purpose: "sale" | "rent" | "season",
    price: number | null,
  ) {
    set(
      "offers",
      (data.offers || []).map((offer) =>
        offer.purpose === purpose ? { ...offer, price } : offer,
      ),
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = propertySchema.parse({
        ...data,
        purpose: data.offers?.[0]?.purpose || data.purpose,
        price: data.offers?.[0]?.price ?? null,
        imageIds: images.map((i) => i.id),
      });
      await api(
        `admin/properties${property ? `/${property.id}` : ""}`,
        payload,
        property ? "PUT" : "POST",
      );
      newImageIds.current.clear();
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
  async function cancelEditor() {
    setBusy(true);
    await Promise.allSettled(
      [...newImageIds.current].map((id) =>
        api(`admin/media/${id}`, {}, "DELETE"),
      ),
    );
    newImageIds.current.clear();
    setBusy(false);
    onCancel();
  }
  async function removeImage(image: (typeof images)[number]) {
    setImages((items) => items.filter((item) => item.id !== image.id));
    if (newImageIds.current.delete(image.id))
      await api(`admin/media/${image.id}`, {}, "DELETE").catch((err) =>
        setError((err as Error).message),
      );
  }
  if (!config)
    return (
      <>
        <Busy />
        <Notice error>{error}</Notice>
      </>
    );
  return (
    <>
      <form onSubmit={submit} className="property-editor">
        <button
          type="button"
          className="back-link"
          onClick={cancelEditor}
          disabled={busy}
        >
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
            <fieldset className="span-2">
              <legend>Finalidades</legend>
              <div className="checkbox-group">
                {Object.entries(purposes).map(([value, label]) => {
                  const purpose = value as "sale" | "rent" | "season";
                  return (
                    <label className="check-line" key={value}>
                      <input
                        type="checkbox"
                        checked={(data.offers || []).some(
                          (offer) => offer.purpose === purpose,
                        )}
                        onChange={(e) => toggleOffer(purpose, e.target.checked)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>{" "}
            <label>
              Tipo do imóvel
              <input
                required
                list="property-types"
                value={data.type}
                onChange={(e) => set("type", e.target.value)}
              />
              <datalist id="property-types">
                {[
                  "Apartamento",
                  "Casa",
                  "Cobertura",
                  "Terreno",
                  "Comercial",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
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
            {(data.offers || []).map((offer) => (
              <label key={offer.purpose}>
                Valor — {purposes[offer.purpose]} (R$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offer.price ?? ""}
                  placeholder="Vazio = sob consulta"
                  onChange={(e) =>
                    setOfferPrice(
                      offer.purpose,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
            ))}{" "}
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
              <input
                type="checkbox"
                checked={data.superFeatured}
                onChange={(e) => set("superFeatured", e.target.checked)}
              />
              <span>Super Destaque</span>
            </label>
          </div>
        </section>
        {(data.offers || []).some(
          (offer) => offer.purpose === "rent" || offer.purpose === "season",
        ) && (
          <section className="admin-card">
            <h2>Despesas da locação</h2>
            <div className="form-grid">
              {(
                [
                  ["condominiumFee", "condominiumPeriod", "Condomínio"],
                  ["iptuFee", "iptuPeriod", "IPTU"],
                  ["trashFee", "trashPeriod", "Taxa de lixo"],
                  ["otherFees", "otherFeesPeriod", "Outras taxas"],
                ] as const
              ).map(([valueKey, periodKey, label]) => (
                <div className="expense-field" key={valueKey}>
                  <label>
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={data[valueKey] ?? ""}
                      onChange={(e) =>
                        set(
                          valueKey,
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </label>
                  <label>
                    Periodicidade
                    <select
                      value={data[periodKey] || ""}
                      onChange={(e) =>
                        set(
                          periodKey,
                          (e.target.value ||
                            null) as FormValue[typeof periodKey],
                        )
                      }
                    >
                      <option value="">Não informada</option>
                      <option value="monthly">Mensal</option>
                      <option value="annual">Anual</option>
                    </select>
                  </label>
                </div>
              ))}
              <label className="span-2">
                Descrição das outras taxas
                <input
                  value={data.otherFeesDescription}
                  onChange={(e) => set("otherFeesDescription", e.target.value)}
                />
              </label>
            </div>
          </section>
        )}
        <section className="admin-card">
          <h2>Localização e características</h2>
          <div className="form-grid">
            <label className="span-2">
              Condomínio / Empreendimento
              <input
                value={condominiumQuery}
                onChange={(e) => setCondominiumQuery(e.target.value)}
                placeholder="Pesquise pelo nome"
                list="condominiums-list"
              />
              <datalist id="condominiums-list">
                {condominiums.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>
            </label>
            <div className="span-2 condominium-picker-actions">
              {condominiums
                .filter(
                  (item) =>
                    !condominiumQuery ||
                    item.name
                      .toLowerCase()
                      .includes(condominiumQuery.toLowerCase()),
                )
                .slice(0, 6)
                .map((item) => (
                  <button
                    type="button"
                    className={`chip-button ${data.condominiumId === item.id ? "active" : ""}`}
                    key={item.id}
                    onClick={() => {
                      set("condominiumId", item.id);
                      setCondominiumQuery(item.name);
                      setData((current) => ({
                        ...current,
                        condominiumId: item.id,
                        city: current.city || item.city,
                        neighborhood: current.neighborhood || item.neighborhood,
                        publicAddress:
                          current.publicAddress ||
                          `${item.street}, ${item.number}`,
                        privateAddress:
                          current.privateAddress ||
                          `${item.street}, ${item.number}${item.complement ? ` - ${item.complement}` : ""}`,
                      }));
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              {data.condominiumId && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => set("condominiumId", null)}
                >
                  Continuar sem condomínio
                </button>
              )}
              <button
                type="button"
                className="button secondary"
                onClick={() => setCreatingCondominium(true)}
              >
                + Cadastrar novo condomínio
              </button>
            </div>
            <label>
              Cidade
              <input
                required
                value={data.city}
                list="property-cities"
                onChange={(e) => set("city", e.target.value)}
              />
              <datalist id="property-cities">
                <option>Balneário Camboriú</option>
                <option>Camboriú</option>
                <option>Itajaí</option>
              </datalist>
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
                ["builtArea", "Área construída (m²)"],
                ["landArea", "Área do terreno (m²)"],
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
          <SortableMediaGallery
            images={images}
            setImages={setImages}
            onRemove={removeImage}
            onUploaded={(image) => {
              newImageIds.current.add(image.id);
              setImages((items) =>
                items.some((item) => item.id === image.id)
                  ? items
                  : [...items, image],
              );
            }}
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
            <button
              type="button"
              className="button secondary"
              onClick={cancelEditor}
              disabled={busy}
            >
              Cancelar
            </button>
            <button className="button" disabled={busy}>
              {busy ? "Salvando…" : "Salvar imóvel"}
            </button>
          </div>
        </div>
      </form>
      {creatingCondominium && (
        <Modal
          title="Novo condomínio"
          wide
          onClose={() => setCreatingCondominium(false)}
        >
          <CondominiumEditor
            condominium={null}
            embedded
            onCancel={() => setCreatingCondominium(false)}
            onSaved={async (saved) => {
              setCreatingCondominium(false);
              setCondominiums((items) => [
                saved,
                ...items.filter((item) => item.id !== saved.id),
              ]);
              setCondominiumQuery(saved.name);
              set("condominiumId", saved.id);
            }}
          />
        </Modal>
      )}
    </>
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
