import { sorts, type PropertySearchParams } from "@/domain/property";
export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function asURLSearchParams(
  input: Record<string, string | string[] | undefined>,
) {
  const result = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) =>
    (Array.isArray(value) ? value : value === undefined ? [] : [value]).forEach(
      (v) => result.append(key, v),
    ),
  );
  return result;
}
export function parseSearch(input: URLSearchParams) {
  const issues: string[] = [];
  const array = (key: string) =>
    [
      ...new Set(
        input
          .getAll(key)
          .flatMap((v) => v.split(","))
          .filter(Boolean),
      ),
    ].slice(0, 30);
  const number = (key: string, max: number, integer = false) => {
    const raw = input.get(key);
    if (!raw?.trim()) return undefined;
    const n = Number(raw);
    if (
      !Number.isFinite(n) ||
      n < 0 ||
      n > max ||
      (integer && !Number.isInteger(n))
    ) {
      issues.push(`O valor de ${key} foi ignorado por ser inválido.`);
      return undefined;
    }
    return n;
  };
  const order = input.get("sort");
  const params: PropertySearchParams = {
    q: (input.get("q") || "").trim().slice(0, 150),
    city: array("city"),
    neighborhood: array("neighborhood"),
    type: array("type"),
    amenities: array("amenities"),
    buildingAmenities: array("buildingAmenities"),
    bedrooms: number("bedrooms", 20, true),
    suites: number("suites", 20, true),
    parking: number("parking", 20, true),
    minRent: number("minRent", 1000000),
    maxRent: number("maxRent", 1000000),
    minArea: number("minArea", 1000000),
    maxArea: number("maxArea", 1000000),
    sort: sorts.includes(order as PropertySearchParams["sort"])
      ? (order as PropertySearchParams["sort"])
      : "relevance",
    page: Math.max(1, number("page", 100000, true) ?? 1),
  };
  if (
    params.minRent !== undefined &&
    params.maxRent !== undefined &&
    params.minRent > params.maxRent
  )
    issues.push("O aluguel mínimo deve ser menor ou igual ao máximo.");
  if (
    params.minArea !== undefined &&
    params.maxArea !== undefined &&
    params.minArea > params.maxArea
  )
    issues.push("A área mínima deve ser menor ou igual à máxima.");
  return { params, issues };
}
export function searchQuery(
  params: PropertySearchParams,
  overrides: Partial<PropertySearchParams> = {},
) {
  const query = new URLSearchParams();
  Object.entries({ ...params, ...overrides }).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === "" ||
      (key === "page" && value === 1) ||
      (key === "sort" && value === "relevance")
    )
      return;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else query.set(key, String(value));
  });
  return query.toString();
}
export const searchHref = (
  params: PropertySearchParams,
  overrides: Partial<PropertySearchParams> = {},
) =>
  "/buscar" +
  (searchQuery(params, overrides) ? "?" + searchQuery(params, overrides) : "");
