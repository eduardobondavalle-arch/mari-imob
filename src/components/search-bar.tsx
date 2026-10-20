import { ArrowRight, MapPin, Search } from "lucide-react";
import type { PropertyFacets } from "@/domain/property";
export function SearchBar({ facets }: { facets: PropertyFacets }) {
  return (
    <form action="/buscar" className="hero-search">
      <div className="hero-search-intro">
        <span className="search-tab">
          <span /> LOCAÇÃO ANUAL
        </span>
        <p>
          Seu novo lar
          <br />
          <strong>começa aqui.</strong>
        </p>
      </div>
      <div className="hero-fields">
        <label>
          <span>
            <MapPin size={15} /> Onde você quer morar?
          </span>
          <select name="city" defaultValue="">
            <option value="">Todas as cidades</option>
            {facets.cities.map((o) => (
              <option value={o.value} key={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tipo de imóvel</span>
          <select name="type" defaultValue="">
            <option value="">Todos os tipos</option>
            {facets.types.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="hero-query">
          <span>Código, bairro ou edifício</span>
          <div>
            <input
              name="q"
              placeholder="O que você procura?"
              aria-label="Código, bairro ou edifício"
            />
            <Search size={17} />
          </div>
        </label>
        <button className="button button-orange" type="submit">
          Encontrar meu lar <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
