export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "boolean"
  | "select"
  | "multiselect"
  | "date";
export type Field = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  public: boolean;
  filterable: boolean;
  archived: boolean;
  options: { id: string; value: string }[];
};
export type Listing = {
  id: string;
  code: string;
  slug: string;
  title: string;
  headline: string;
  purpose: string;
  type: string;
  status: string;
  featured: boolean;
  superFeatured: boolean;
  price: number | null;
  condominiumFee?: number | null;
  condominiumPeriod?: string | null;
  iptuFee?: number | null;
  iptuPeriod?: string | null;
  trashFee?: number | null;
  trashPeriod?: string | null;
  otherFees?: number | null;
  otherFeesPeriod?: string | null;
  otherFeesDescription?: string;
  city: string;
  cityId?: string | null;
  neighborhood: string;
  publicAddress: string;
  privateAddress?: string;
  description: string;
  videoUrl: string;
  bedrooms: number | null;
  suites: number | null;
  bathrooms?: number | null;
  parking: number | null;
  area: number | null;
  categoryId: string | null;
  situationId: string | null;
  category: { id: string; name: string } | null;
  situation: { id: string; name: string } | null;
  images: {
    id: string;
    key: string;
    alt: string;
    width: number;
    height: number;
    position: number;
  }[];
  tags: { id: string; name: string; key?: string | null }[];
  values: { fieldId: string; value: unknown; field: Field }[];
};
export type SiteContent = {
  brandName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  accentColor: string;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  featuredTitle: string;
  aboutTitle: string;
  aboutEyebrow: string;
  aboutText: string;
  aboutImage: string;
  aboutButtonText: string;
  aboutButtonUrl: string;
  contactTitle: string;
  footerText: string;
  whatsapp: string;
  whatsappPhoto: string;
  whatsappMessage: string;
  whatsappEnabled: boolean;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  creci: string;
  professionalInfo: string;
};
export type ClientState = {
  firstName: string;
  phone: string;
  items: Listing[];
  publicToken: string;
} | null;
export const purposes: Record<string, string> = {
  sale: "Comprar",
  rent: "Alugar",
};
export const statuses: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  hidden: "Oculto",
  sold: "Vendido",
  rented: "Alugado",
};
export const fieldTypes: Record<FieldType, string> = {
  text: "Texto",
  textarea: "Texto longo",
  number: "Número",
  money: "Valor monetário",
  boolean: "Sim/não",
  select: "Seleção única",
  multiselect: "Seleção múltipla",
  date: "Data",
};
export const priceLabel = (value: number | null) =>
  value === null
    ? "Sob consulta"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(value);
export function phoneMask(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
}
