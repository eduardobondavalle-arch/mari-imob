export interface PropertyMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt: string;
  width?: number;
  height?: number;
  source: string;
}
export interface Expense {
  amount: number | null;
  period: "monthly" | "annual" | "unknown";
}
export interface PropertyCosts {
  rent: number | null;
  condominium: Expense;
  iptu: Expense;
}
export interface PropertyLocation {
  city: string;
  cityName: string;
  neighborhood: string;
  neighborhoodName: string;
  state: string;
  precision: "neighborhood";
}
export interface Building {
  id: string;
  name: string;
  amenities: string[];
}
export interface Property {
  id: string;
  code: string;
  slug: string;
  isDemo: boolean;
  purpose: "annual-rent";
  publication: "published" | "draft";
  available: boolean;
  title: string;
  description: string;
  type: string;
  typeName: string;
  location: PropertyLocation;
  media: PropertyMedia[];
  costs: PropertyCosts;
  bedrooms: number | null;
  suites: number | null;
  parking: number | null;
  area: number | null;
  amenities: string[];
  building?: Building;
  publishedAt: string;
  featured: boolean;
  badge?: string;
}
export const sorts = [
  "relevance",
  "price-asc",
  "price-desc",
  "recent",
] as const;
export interface PropertySearchParams {
  q: string;
  city: string[];
  neighborhood: string[];
  type: string[];
  amenities: string[];
  buildingAmenities: string[];
  bedrooms?: number;
  suites?: number;
  parking?: number;
  minRent?: number;
  maxRent?: number;
  minArea?: number;
  maxArea?: number;
  sort: (typeof sorts)[number];
  page: number;
}
export interface Option {
  value: string;
  label: string;
  city?: string;
}
export interface PropertyFacets {
  cities: Option[];
  neighborhoods: Option[];
  types: Option[];
  amenities: Option[];
  buildingAmenities: Option[];
  bedrooms: number[];
  suites: number[];
  parking: number[];
}
export interface SearchResult {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
  facets: PropertyFacets;
}
export interface PropertyRepository {
  search(params: PropertySearchParams): Promise<SearchResult>;
  getBySlug(slug: string): Promise<Property | null>;
  getFeatured(): Promise<Property[]>;
  getSimilar(id: string): Promise<Property[]>;
}
