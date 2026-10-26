import { Bath, BedDouble, Building2, CarFront, Flame, PawPrint, Ruler, Sofa, Sparkles, Waves } from "lucide-react";
import type { Listing } from "@/lib/mari/types";

function valueLabel(value: unknown) {
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
function valid(value: unknown) {
  return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
}
function iconFor(label: string) {
  const value = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/banheiro|banheira/.test(value)) return Bath;
  if (/quarto|dormitorio|suite/.test(value)) return BedDouble;
  if (/vaga|garagem/.test(value)) return CarFront;
  if (/area|terreno|metr/.test(value)) return Ruler;
  if (/mar|piscina|agua/.test(value)) return Waves;
  if (/mobil|sofa/.test(value)) return Sofa;
  if (/churras|fogo/.test(value)) return Flame;
  if (/pet|animal/.test(value)) return PawPrint;
  return Sparkles;
}

export function PropertyCharacteristics({ property: p }: { property: Listing }) {
  const items = [
    { label: "Quartos", value: p.bedrooms, Icon: BedDouble },
    { label: "Suítes", value: p.suites, Icon: BedDouble },
    { label: "Banheiros", value: p.bathrooms, Icon: Bath },
    { label: "Vagas", value: p.parking, Icon: CarFront },
    { label: "Área privativa", value: p.area == null ? null : `${p.area} m²`, Icon: Ruler },
    { label: "Área construída", value: p.builtArea == null ? null : `${p.builtArea} m²`, Icon: Ruler },
    { label: "Terreno", value: p.landArea == null ? null : `${p.landArea} m²`, Icon: Ruler },
    { label: "Categoria", value: p.category?.name, Icon: Building2 },
    { label: "Situação", value: p.situation?.name, Icon: Building2 },
    ...p.values.map((entry) => ({ label: entry.field.label, value: entry.value, Icon: iconFor(entry.field.label) })),
  ].filter((item) => valid(item.value));
  if (!items.length) return null;
  return <div className="property-characteristics" aria-label="Características do imóvel">
    {items.map(({ label, value, Icon }, index) => <div className="property-characteristic" key={`${label}-${index}`}>
      <Icon size={19} aria-hidden="true" />
      <span><strong>{valueLabel(value)}</strong> <small>{label}</small></span>
    </div>)}
  </div>;
}
