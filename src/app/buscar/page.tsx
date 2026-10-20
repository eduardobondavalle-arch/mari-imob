import Link from "next/link";
import { SearchBox } from "@/components/mari/site";
import { AdvancedFilters } from "@/components/mari/advanced-filters";
import { PropertyGrid } from "@/components/mari/property";
import { searchCatalog } from "@/lib/mari/catalog";
export const metadata = { title: "Encontre seu imóvel" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const initial: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw))
    if (typeof value === "string") initial[key] = value;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw))
    for (const item of Array.isArray(value) ? value : value ? [value] : [])
      params.append(key, item);
  const data = await searchCatalog(params);
  if (initial.cityId)
    initial.city = data.cities.find((c) => c.id === initial.cityId)?.name || "";
  const pageUrl = (page: number) => {
    const p = new URLSearchParams(params);
    p.set("page", String(page));
    return `/buscar?${p}`;
  };
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <p className="eyebrow">SEU PRÓXIMO ENDEREÇO COMEÇA AQUI</p>
          <h1>
            Encontre o seu lugar<span className="title-dot">.</span>
          </h1>
          <p>
            Escolha o que importa para você. Explore as possibilidades com
            calma.
          </p>
        </div>
      </div>
      <div className="container search-page">
        <SearchBox
          key={`basic-${params}`}
          data={data}
          initial={{ purpose: "", ...initial }}
          preserveQuery={params.toString()}
        />
        <AdvancedFilters
          key={params.toString()}
          data={data}
          query={params.toString()}
        />
        <div className="results-toolbar">
          <span>
            <strong>{data.total}</strong>{" "}
            {data.total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </span>
          <span>Balneário Camboriú & região</span>
        </div>
        {data.items.length ? (
          <PropertyGrid items={data.items} />
        ) : (
          <div className="empty-state">
            <h2>Ainda não encontramos essa combinação.</h2>
            <p>
              Experimente outros filtros ou conte à Mari o que você procura.
            </p>
            <div className="button-row">
              <Link className="button secondary" href="/buscar">
                Limpar filtros
              </Link>
              <Link className="button" href="/contato">
                Conversar com a Mari
              </Link>
            </div>
          </div>
        )}
        {data.pages > 1 && (
          <nav className="pagination" aria-label="Paginação">
            {data.page > 1 && (
              <Link href={pageUrl(data.page - 1)}>Anterior</Link>
            )}
            <span>
              Página {data.page} de {data.pages}
            </span>
            {data.page < data.pages && (
              <Link href={pageUrl(data.page + 1)}>Próxima página</Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
