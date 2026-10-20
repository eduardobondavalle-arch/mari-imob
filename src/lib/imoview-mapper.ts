import type { Property, PropertyMedia } from "@/domain/property";

export interface ImoviewPhoto {
  descricao?: string;
  url?: string;
  urlm?: string;
  urlp?: string;
  urlpp?: string;
}

export interface ImoviewProperty {
  codigo: number;
  codigoauxiliar?: string;
  titulo: string;
  metadescription?: string;
  finalidade?: string;
  tipo?: string;
  situacao?: string;
  valor?: string;
  valorcondominio?: string;
  valoriptu?: string;
  valoriptuanual?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numeroquartos?: string | number;
  numerosuites?: string | number;
  numerovagas?: string | number;
  areaprincipal?: string | number;
  edificio?: string;
  nomecondominio?: string;
  codigocondominio?: number;
  descricao?: string;
  datahoracadastro?: string;
  destaque?: string;
  urlfotoprincipal?: string;
  descricaoFotoPrincipal?: string;
  fotos?: ImoviewPhoto[];
  [key: string]: unknown;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function parseBRLCents(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim();
  if (!str) return null;
  const digits = str.replace(/\D/g, "");
  if (!digits) return null;
  return parseInt(digits, 10);
}

export function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).replace(",", ".").trim();
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

const unitAmenityMap: Record<string, string> = {
  mobiliado: "Mobiliado",
  arcondicionado: "Ar-condicionado",
  areaservico: "Área de serviço",
  armariobanheiro: "Armário no banheiro",
  armariocozinha: "Armário na cozinha",
  armarioquarto: "Armário no quarto",
  box: "Box nos banheiros",
  closet: "Closet",
  lavabo: "Lavabo",
  vistamar: "Vista para o mar",
  vistamontanha: "Vista para as montanhas",
  permiteanimais: "Aceita pet",
  varandagourmet: "Varanda gourmet",
  lareira: "Lareira",
  conexaointernet: "Conexão de internet",
};

const buildingAmenityMap: Record<string, string> = {
  academia: "Academia",
  churrasqueira: "Churrasqueira",
  hidromassagem: "Hidromassagem",
  piscina: "Piscina",
  playground: "Playground",
  salamassagem: "Sala de massagem",
  salaofestas: "Salão de festas",
  salaojogos: "Salão de jogos",
  sauna: "Sauna",
  espacogourmet: "Espaço gourmet",
  portaria24horas: "Portaria 24h",
  seguranca24horas: "Segurança 24h",
};

export function mapImoviewToProperty(raw: ImoviewProperty): Property {
  const code = String(raw.codigo);
  const typeName = raw.tipo || "Apartamento";
  const typeSlug = slugify(typeName);
  const city = raw.cidade || "Balneário Camboriú";
  const citySlug = slugify(city);
  const neighborhood = raw.bairro || "Centro";
  const neighborhoodSlug = slugify(neighborhood);

  const media: PropertyMedia[] = (raw.fotos || [])
    .map((f, i) => ({
      id: `${code}-foto-${i + 1}`,
      type: "image" as const,
      url: f.url || f.urlm || f.urlp || "",
      alt: f.descricao && f.descricao.trim() ? f.descricao.trim() : `${raw.titulo} - Foto ${i + 1}`,
      source: "Imoview",
    }))
    .filter((m) => Boolean(m.url));

  if (!media.length && raw.urlfotoprincipal) {
    media.push({
      id: `${code}-principal`,
      type: "image",
      url: raw.urlfotoprincipal,
      alt: raw.descricaoFotoPrincipal || raw.titulo,
      source: "Imoview",
    });
  }

  const amenities: string[] = [];
  for (const [key, label] of Object.entries(unitAmenityMap)) {
    if (raw[key] === true || raw[key] === "true") {
      amenities.push(label);
    }
  }

  const buildingAmenities: string[] = [];
  for (const [key, label] of Object.entries(buildingAmenityMap)) {
    if (raw[key] === true || raw[key] === "true") {
      buildingAmenities.push(label);
    }
  }

  const buildingName = raw.nomecondominio || raw.edificio || "";
  const building = buildingName
    ? {
        id: `b-${raw.codigocondominio || raw.codigo}`,
        name: buildingName,
        amenities: buildingAmenities,
      }
    : undefined;

  let publishedAt = new Date().toISOString();
  if (raw.datahoracadastro) {
    const parts = raw.datahoracadastro.split(" ");
    if (parts[0]) {
      const [d, m, y] = parts[0].split("/");
      if (d && m && y) {
        publishedAt = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${parts[1] || "00:00:00"}Z`;
      }
    }
  }

  const rentCents = parseBRLCents(raw.valor);
  const condoCents = parseBRLCents(raw.valorcondominio);
  const iptuCents = parseBRLCents(raw.valoriptu || raw.valoriptuanual);

  return {
    id: code,
    code,
    slug: `${typeSlug}-${neighborhoodSlug}-${code}`,
    isDemo: false,
    purpose: "annual-rent",
    publication: raw.situacao === "Vago/Disponível" ? "published" : "draft",
    available: raw.situacao === "Vago/Disponível",
    title: raw.titulo,
    description: raw.descricao || raw.metadescription || raw.titulo,
    type: typeSlug,
    typeName,
    location: {
      city: citySlug,
      cityName: city,
      neighborhood: neighborhoodSlug,
      neighborhoodName: neighborhood,
      state: raw.estado || "SC",
      precision: "neighborhood",
    },
    media,
    costs: {
      rent: rentCents,
      condominium: { amount: condoCents, period: "monthly" },
      iptu: { amount: iptuCents, period: "monthly" },
    },
    bedrooms: parseNumber(raw.numeroquartos),
    suites: parseNumber(raw.numerosuites),
    parking: parseNumber(raw.numerovagas),
    area: parseNumber(raw.areaprincipal),
    amenities,
    building,
    publishedAt,
    featured: raw.destaque === "Destaque" || Boolean(raw.destaque),
    badge: raw.destaque === "Destaque" ? "Destaque" : undefined,
  };
}

