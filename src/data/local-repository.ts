import type {
  Property,
  PropertyFacets,
  PropertyRepository,
  PropertySearchParams,
} from "@/domain/property";
import { normalize } from "@/lib/search";
const eligible = (p: Property) =>
  p.publication === "published" && p.available && p.purpose === "annual-rent";
const unique = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));
export function facetsFor(items: Property[]): PropertyFacets {
  return {
    cities: [
      ...new Map(
        items.map((p) => [
          p.location.city,
          { value: p.location.city, label: p.location.cityName },
        ]),
      ).values(),
    ],
    neighborhoods: [
      ...new Map(
        items.map((p) => [
          `${p.location.city}/${p.location.neighborhood}`,
          {
            value: p.location.neighborhood,
            label: p.location.neighborhoodName,
            city: p.location.city,
          },
        ]),
      ).values(),
    ],
    types: [
      ...new Map(
        items.map((p) => [p.type, { value: p.type, label: p.typeName }]),
      ).values(),
    ],
    amenities: unique(items.flatMap((p) => p.amenities)).map((v) => ({
      value: v,
      label: v,
    })),
    buildingAmenities: unique(
      items.flatMap((p) => p.building?.amenities || []),
    ).map((v) => ({ value: v, label: v })),
    bedrooms: [
      ...new Set(
        items.flatMap((p) => (p.bedrooms === null ? [] : [p.bedrooms])),
      ),
    ].sort((a, b) => a - b),
    suites: [
      ...new Set(items.flatMap((p) => (p.suites === null ? [] : [p.suites]))),
    ].sort((a, b) => a - b),
    parking: [
      ...new Set(items.flatMap((p) => (p.parking === null ? [] : [p.parking]))),
    ].sort((a, b) => a - b),
  };
}
function matches(p: Property, s: PropertySearchParams) {
  const text = normalize(
    [
      p.code,
      p.title,
      p.description,
      p.location.cityName,
      p.location.neighborhoodName,
      p.building?.name,
    ].join(" "),
  );
  if (
    s.q &&
    !normalize(s.q)
      .split(/\s+/)
      .every((word) => text.includes(word))
  )
    return false;
  if (
    (s.city.length && !s.city.includes(p.location.city)) ||
    (s.neighborhood.length &&
      !s.neighborhood.includes(p.location.neighborhood)) ||
    (s.type.length && !s.type.includes(p.type))
  )
    return false;
  if (
    !s.amenities.every((v) => p.amenities.includes(v)) ||
    !s.buildingAmenities.every((v) => p.building?.amenities.includes(v))
  )
    return false;
  for (const key of ["bedrooms", "suites", "parking"] as const)
    if (s[key] !== undefined && (p[key] === null || p[key]! < s[key]!))
      return false;
  const ranges: [number | null, number | undefined, number | undefined][] = [
    [p.costs.rent === null ? null : p.costs.rent / 100, s.minRent, s.maxRent],
    [p.area, s.minArea, s.maxArea],
  ];
  for (const [value, min, max] of ranges) {
    if (min !== undefined && (value === null || value! < min)) return false;
    if (max !== undefined && (value === null || value! > max)) return false;
  }
  return true;
}
export function createLocalRepository(
  load: () => Promise<Property[]>,
): PropertyRepository {
  return {
    async search(s) {
      const all = (await load()).filter(eligible);
      const facets = facetsFor(all);
      const found = all.filter((p) => matches(p, s));
      const score = (p: Property) =>
        (normalize(p.code) === normalize(s.q) ? 100 : 0) +
        (normalize(p.title).includes(normalize(s.q)) && s.q ? 10 : 0) +
        (p.featured ? 1 : 0);
      found.sort((a, b) => {
        let order = 0;
        if (s.sort === "price-asc" || s.sort === "price-desc") {
          const x = a.costs.rent,
            y = b.costs.rent;
          order =
            x === null
              ? y === null
                ? 0
                : 1
              : y === null
                ? -1
                : (x - y) * (s.sort === "price-desc" ? -1 : 1);
        } else if (s.sort === "recent")
          order = b.publishedAt.localeCompare(a.publishedAt);
        else order = score(b) - score(a);
        return order || a.code.localeCompare(b.code);
      });
      const pageSize = 6,
        page = Math.min(
          s.page,
          Math.max(1, Math.ceil(found.length / pageSize)),
        );
      return {
        items: found.slice((page - 1) * pageSize, page * pageSize),
        total: found.length,
        page,
        pageSize,
        facets,
      };
    },
    async getBySlug(slug) {
      const all = await load();
      return (
        all.find(
          (p) =>
            p.publication === "published" &&
            (p.slug === slug || p.code === slug.split("-").at(-1)),
        ) ?? null
      );
    },
    async getFeatured() {
      return (await load())
        .filter((p) => eligible(p) && p.featured)
        .slice(0, 4);
    },
    async getSimilar(id) {
      const all = await load(),
        p = all.find((v) => v.id === id);
      if (!p) return [];
      const score = (v: Property) =>
        (v.location.city === p.location.city ? 100 : 0) +
        (v.type === p.type ? 50 : 0) -
        Math.abs((v.bedrooms ?? 0) - (p.bedrooms ?? 0)) * 5 -
        Math.abs((v.costs.rent ?? 0) - (p.costs.rent ?? 0)) / 100000;
      return all
        .filter(
          (v) =>
            eligible(v) &&
            v.id !== id &&
            (v.location.city === p.location.city || v.type === p.type),
        )
        .sort((a, b) => score(b) - score(a) || a.code.localeCompare(b.code))
        .slice(0, 3);
    },
  };
}
