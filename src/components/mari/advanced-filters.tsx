"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Notice } from "./ui";
import { type Field, purposes } from "@/lib/mari/types";
export type FilterData = {
  total: number;
  fields: Field[];
  locations: {
    city: string;
    cityId: string | null;
    neighborhood: string;
    type: string;
  }[];
  cities: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  taxonomies: { id: string; name: string; kind: string }[];
};
export function AdvancedFilters({
  data,
  query,
}: {
  data: FilterData;
  query: string;
}) {
  const normalized = new URLSearchParams(query);
  if (normalized.get("city") && !normalized.get("cityId")) {
    const city = data.cities.find((c) => c.name === normalized.get("city"));
    if (city) {
      normalized.set("cityId", city.id);
      normalized.delete("city");
    }
  }
  query = normalized.toString();
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(query),
    [count, setCount] = useState<number | null>(data.total),
    [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null),
    params = new URLSearchParams(draft);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/properties?${draft}`, {
          signal: controller.signal,
        });
        const value = await response.json();
        if (!response.ok) throw new Error(value.error);
        setCount(value.total);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      }
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [draft, open]);
  function read() {
    if (!form.current) return;
    const p = new URLSearchParams();
    for (const [key, value] of new FormData(form.current))
      if (String(value)) p.append(key, String(value));
    setDraft(p.toString());
    setCount(null);
  }
  const select = (
    name: string,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label key={name}>
      {label}
      <select name={name} defaultValue={params.get(name) || ""}>
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const number = (name: string, label: string) => (
    <label key={name}>
      {label}
      <input
        name={name}
        type="number"
        min="0"
        step="any"
        defaultValue={params.get(name) || ""}
      />
    </label>
  );
  const active = [...new URLSearchParams(query).entries()].filter(
    ([k, v]) => v && !["sort", "page"].includes(k),
  ).length;
  return (
    <>
      <button
        className="button secondary advanced-filter-button"
        onClick={() => {
          setDraft(query);
          setCount(data.total);
          setOpen(true);
        }}
      >
        Filtros avançados {active > 0 && `(${active})`}
      </button>
      {open && (
        <Modal
          className="m-filter-modal"
          title="Filtros de imóveis"
          onClose={() => setOpen(false)}
        >
          <form
            ref={form}
            className="modal-content filter-drawer"
            key={query}
            onChange={read}
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/buscar?${draft}`);
              setOpen(false);
            }}
          >
            <div className="form-grid">
              {select(
                "purpose",
                "Finalidade",
                Object.entries(purposes).map(([value, label]) => ({
                  value,
                  label,
                })),
              )}
              {select(
                "cityId",
                "Cidade",
                data.cities.map((c) => ({ value: c.id, label: c.name })),
              )}
              {select(
                "neighborhood",
                "Bairro",
                [
                  ...new Set(
                    data.locations
                      .filter((l) =>
                        params.get("cityId")
                          ? l.cityId === params.get("cityId")
                          : !params.get("city") ||
                            l.city === params.get("city"),
                      )
                      .map((l) => l.neighborhood),
                  ),
                ].map((v) => ({ value: v, label: v })),
              )}
              {select(
                "type",
                "Tipo de imóvel",
                [...new Set(data.locations.map((l) => l.type))].map((v) => ({
                  value: v,
                  label: v,
                })),
              )}
              {["category", "situation"].map((kind) =>
                select(
                  `${kind}Id`,
                  kind === "category" ? "Categoria" : "Situação",
                  data.taxonomies
                    .filter((t) => t.kind === kind)
                    .map((t) => ({ value: t.id, label: t.name })),
                ),
              )}
              <label>
                Título ou código
                <input name="q" defaultValue={params.get("q") || ""} />
              </label>
              {[
                ["minPrice", "Preço mínimo"],
                ["maxPrice", "Preço máximo"],
                ["minArea", "Área mínima (m²)"],
                ["maxArea", "Área máxima (m²)"],
                ["bedrooms", "Quartos (mínimo)"],
                ["suites", "Suítes (mínimo)"],
                ["bathrooms", "Banheiros (mínimo)"],
                ["parking", "Vagas (mínimo)"],
              ].map(([k, l]) => number(k, l))}
              {select("sort", "Ordenar por", [
                { value: "relevance", label: "Relevância" },
                { value: "price-asc", label: "Menor preço" },
                { value: "price-desc", label: "Maior preço" },
              ])}
            </div>
            <fieldset>
              <legend>Diferenciais e tags</legend>
              <div className="filter-checks">
                {data.tags.map((t) => (
                  <label key={t.id}>
                    <input
                      type="checkbox"
                      name="tag"
                      value={t.id}
                      defaultChecked={params.getAll("tag").includes(t.id)}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {data.fields.map((f) => {
              const key = `field_${f.id}`;
              return (
                <fieldset key={f.id}>
                  <legend>{f.label}</legend>
                  {f.type === "boolean" ? (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name={key}
                        value="true"
                        defaultChecked={params.get(key) === "true"}
                      />
                      Sim
                    </label>
                  ) : f.type === "multiselect" ? (
                    <div className="filter-checks">
                      {f.options.map((o) => (
                        <label key={o.id}>
                          <input
                            type="checkbox"
                            name={key}
                            value={o.value}
                            defaultChecked={params
                              .getAll(key)
                              .includes(o.value)}
                          />
                          {o.value}
                        </label>
                      ))}
                    </div>
                  ) : f.type === "select" ? (
                    select(
                      key,
                      "Opção",
                      f.options.map((o) => ({
                        value: o.value,
                        label: o.value,
                      })),
                    )
                  ) : ["number", "money"].includes(f.type) ? (
                    <div className="form-grid">
                      {number(`${key}_min`, "Mínimo")}
                      {number(`${key}_max`, "Máximo")}
                    </div>
                  ) : (
                    <input
                      aria-label={f.label}
                      name={key}
                      type={f.type === "date" ? "date" : "text"}
                      defaultValue={params.get(key) || ""}
                    />
                  )}
                </fieldset>
              );
            })}
            <Notice error>{error}</Notice>
            <div className="filter-actions">
              <button className="button" disabled={count === null}>
                {count === null ? "Consultando…" : `Ver ${count} imóveis`}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  router.push("/buscar");
                  setOpen(false);
                }}
              >
                Limpar filtros
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
