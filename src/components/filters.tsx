"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type {
  Option,
  PropertyFacets,
  PropertySearchParams,
} from "@/domain/property";
import { parseSearch, searchHref } from "@/lib/search";
export function FilterPanel({
  params,
  facets,
}: {
  params: PropertySearchParams;
  facets: PropertyFacets;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <aside className="desktop-filters">
        <FilterFields params={params} facets={facets} />
      </aside>
      <button
        className="button button-outline mobile-filter-trigger"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={18} /> Filtrar imóveis
      </button>
      <dialog
        className="filter-dialog"
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        aria-label="Filtros de imóveis"
      >
        <div className="dialog-heading">
          <span>Encontre do seu jeito</span>
          <button
            className="icon-button"
            aria-label="Cancelar filtros"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        {open && (
          <FilterFields
            params={params}
            facets={facets}
            onApplied={() => setOpen(false)}
          />
        )}
      </dialog>
    </>
  );
}
function FilterFields({
  params: p,
  facets,
  onApplied,
}: {
  params: PropertySearchParams;
  facets: PropertyFacets;
  onApplied?: () => void;
}) {
  const id = useId(),
    router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const [cities, setCities] = useState(p.city),
    [neighborhoods, setNeighborhoods] = useState(p.neighborhood);
  const neighborhoodsAvailable = facets.neighborhoods.filter(
    (o) => !cities.length || cities.includes(o.city!),
  );
  const group = (
    name: string,
    label: string,
    options: Option[],
    selected: string[],
  ) => (
    <details
      className="filter-group"
      open={name === "city" || name === "type"}
      key={name}
    >
      <summary>{label}</summary>
      <div className="check-list">
        {options.map((o) => (
          <label key={`${o.city || ""}${o.value}`}>
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={selected.includes(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
  return (
    <form
      className="filter-form"
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const query = new URLSearchParams();
        data.forEach((value, key) => query.append(key, String(value)));
        const parsed = parseSearch(query);
        if (parsed.issues.length) {
          setErrors(parsed.issues);
          return;
        }
        setErrors([]);
        startTransition(() => {
          router.push(searchHref({ ...parsed.params, sort: p.sort, page: 1 }));
          onApplied?.();
        });
      }}
    >
      <div className="filter-title">
        <h2>
          <SlidersHorizontal size={17} /> Refine sua busca
        </h2>
        <Link
          href="/buscar"
          onClick={onApplied}
          aria-label="Limpar todos os filtros"
        >
          <RotateCcw size={15} />
        </Link>
      </div>
      <label className="filter-label" htmlFor={`${id}-q`}>
        Código, bairro ou edifício
      </label>
      <div className="filter-query">
        <Search size={16} />
        <input
          id={`${id}-q`}
          name="q"
          defaultValue={p.q}
          placeholder="O que você procura?"
          maxLength={150}
        />
      </div>
      <details className="filter-group" open>
        <summary>Cidade</summary>
        <div className="check-list">
          {facets.cities.map((o) => (
            <label key={o.value}>
              <input
                type="checkbox"
                name="city"
                value={o.value}
                checked={cities.includes(o.value)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...cities, o.value]
                    : cities.filter((c) => c !== o.value);
                  setCities(updated);
                  setNeighborhoods(
                    neighborhoods.filter((n) =>
                      facets.neighborhoods.some(
                        (v) =>
                          v.value === n &&
                          (!updated.length || updated.includes(v.city!)),
                      ),
                    ),
                  );
                }}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </details>
      <details className="filter-group">
        <summary>Bairro</summary>
        <div className="check-list">
          {neighborhoodsAvailable.map((o) => (
            <label key={`${o.city}-${o.value}`}>
              <input
                name="neighborhood"
                type="checkbox"
                value={o.value}
                checked={neighborhoods.includes(o.value)}
                onChange={(e) =>
                  setNeighborhoods(
                    e.target.checked
                      ? [...neighborhoods, o.value]
                      : neighborhoods.filter((n) => n !== o.value),
                  )
                }
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </details>
      {group("type", "Tipo de imóvel", facets.types, p.type)}
      <div className="filter-group numeric-filters">
        {(["bedrooms", "suites", "parking"] as const).map((key, i) => (
          <label key={key} htmlFor={`${id}-${key}`}>
            {["Quartos", "Suítes", "Vagas"][i]}
            <select id={`${id}-${key}`} name={key} defaultValue={p[key] ?? ""}>
              <option value="">Qualquer</option>
              {facets[key]
                .filter((n) => n > 0)
                .map((n) => (
                  <option value={n} key={n}>
                    {n} ou mais
                  </option>
                ))}
            </select>
          </label>
        ))}
      </div>
      <fieldset className="filter-range">
        <legend>
          Aluguel mensal <span>(R$)</span>
        </legend>
        <div>
          {(["minRent", "maxRent"] as const).map((key, i) => (
            <label key={key} htmlFor={`${id}-${key}`}>
              {i === 0 ? "Mínimo" : "Máximo"}
              <input
                id={`${id}-${key}`}
                name={key}
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                defaultValue={p[key]}
                placeholder={i === 0 ? "0" : "Sem limite"}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="filter-range">
        <legend>
          Área útil <span>(m²)</span>
        </legend>
        <div>
          {(["minArea", "maxArea"] as const).map((key, i) => (
            <label key={key} htmlFor={`${id}-${key}`}>
              {i === 0 ? "Mínima" : "Máxima"}
              <input
                id={`${id}-${key}`}
                name={key}
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                defaultValue={p[key]}
                placeholder={i === 0 ? "0" : "Sem limite"}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {group("amenities", "No imóvel", facets.amenities, p.amenities)}
      {group(
        "buildingAmenities",
        "No condomínio",
        facets.buildingAmenities,
        p.buildingAmenities,
      )}
      {errors.length > 0 && (
        <div role="alert" className="form-error">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      <div className="filter-actions">
        <button className="button button-dark" disabled={pending}>
          {pending ? "Buscando…" : "Aplicar filtros"}
          <ArrowRight size={17} />
        </button>
        <Link href="/buscar" onClick={onApplied}>
          Limpar todos os filtros
        </Link>
      </div>
    </form>
  );
}
export function SortSelect({ params }: { params: PropertySearchParams }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="sort-select">
      Ordenar por{" "}
      <select
        aria-label="Ordenar imóveis"
        value={params.sort}
        disabled={pending}
        onChange={(e) =>
          startTransition(() =>
            router.push(
              searchHref(params, {
                sort: e.target.value as PropertySearchParams["sort"],
                page: 1,
              }),
            ),
          )
        }
      >
        <option value="relevance">Relevância</option>
        <option value="price-asc">Menor aluguel</option>
        <option value="price-desc">Maior aluguel</option>
        <option value="recent">Mais recentes</option>
      </select>
    </label>
  );
}
