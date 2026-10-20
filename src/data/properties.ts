import type { Property, PropertyMedia } from "@/domain/property";
const photos: Record<string, PropertyMedia> = Object.fromEntries(
  [
    ["living", "Sala de estar ilustrativa com luz natural e vista para o mar"],
    ["dining", "Cozinha e sala de jantar ilustrativas"],
    ["bedroom", "Quarto ilustrativo com tons naturais"],
    ["balcony", "Varanda ilustrativa com vista para o mar"],
  ].map(([id, alt]) => [
    id,
    {
      id,
      type: "image",
      url: `/images/${id}.png`,
      alt,
      source:
        "Imagem gerada por IA para demonstração; não representa um imóvel real.",
    },
  ]),
);
const places = [
  ["balneario-camboriu", "Balneário Camboriú", "centro", "Centro"],
  ["balneario-camboriu", "Balneário Camboriú", "pioneiros", "Pioneiros"],
  ["itajai", "Itajaí", "praia-brava", "Praia Brava"],
  ["itapema", "Itapema", "meia-praia", "Meia Praia"],
  ["balneario-camboriu", "Balneário Camboriú", "nacoes", "Nações"],
  ["balneario-camboriu", "Balneário Camboriú", "barra-sul", "Barra Sul"],
  ["itajai", "Itajaí", "fazenda", "Fazenda"],
  ["porto-belo", "Porto Belo", "pereque", "Perequê"],
];
const seeds: [
  string,
  number,
  string,
  number,
  number,
  number,
  number | null,
  number | null,
  string[],
][] = [
  [
    "Apartamento com luz natural e vista para o mar",
    0,
    "apartamento",
    3,
    1,
    2,
    118,
    5800,
    ["living", "dining", "bedroom", "balcony"],
  ],
  [
    "Seu refúgio com varanda na Praia Brava",
    2,
    "apartamento",
    2,
    2,
    2,
    92,
    4900,
    ["balcony", "living", "bedroom"],
  ],
  [
    "Apartamento mobiliado, pronto para uma nova fase",
    3,
    "apartamento",
    2,
    1,
    1,
    85,
    3600,
    ["dining", "bedroom", "living"],
  ],
  [
    "Amplitude e conforto em Pioneiros",
    1,
    "apartamento",
    3,
    3,
    2,
    140,
    6800,
    ["bedroom", "living", "balcony"],
  ],
  [
    "Um studio para simplificar a rotina",
    4,
    "studio",
    1,
    0,
    0,
    38,
    2200,
    ["living"],
  ],
  [
    "Cobertura para viver o litoral por inteiro",
    5,
    "cobertura",
    4,
    3,
    3,
    225,
    12500,
    ["balcony", "dining", "bedroom", "living"],
  ],
  [
    "Apartamento com espaços integrados na Fazenda",
    6,
    "apartamento",
    2,
    1,
    1,
    76,
    3200,
    ["dining", "living", "bedroom"],
  ],
  [
    "Mais espaço para a família em Perequê",
    7,
    "apartamento",
    3,
    1,
    2,
    110,
    4200,
    ["bedroom", "balcony", "living"],
  ],
  [
    "Casa com jardim e espaço para o seu pet",
    4,
    "casa",
    3,
    1,
    2,
    160,
    5200,
    ["living", "dining", "bedroom"],
  ],
  [
    "Apartamento compacto no coração da cidade",
    0,
    "apartamento",
    1,
    1,
    1,
    52,
    2800,
    ["dining", "bedroom"],
  ],
  [
    "Conforto em cada detalhe na Meia Praia",
    3,
    "apartamento",
    3,
    2,
    2,
    130,
    5400,
    ["bedroom", "living", "balcony"],
  ],
  [
    "Studio para uma rotina perto do mar",
    2,
    "studio",
    1,
    0,
    1,
    44,
    2900,
    ["balcony", "dining"],
  ],
  [
    "Apartamento com planta versátil no Centro",
    0,
    "apartamento",
    2,
    1,
    1,
    null,
    null,
    [],
  ],
  [
    "Apartamento reservado em Pioneiros",
    1,
    "apartamento",
    2,
    1,
    1,
    80,
    3900,
    ["living", "bedroom"],
  ],
];
const names: Record<string, string> = {
  apartamento: "Apartamento",
  studio: "Studio",
  casa: "Casa",
  cobertura: "Cobertura",
};
import { imoviewMappedProperties } from "./imoview-data";

const demoProperties: Property[] = seeds.map(
  ([title, place, type, bedrooms, suites, parking, area, rent, media], i) => {
    const [city, cityName, neighborhood, neighborhoodName] = places[place];
    const code = `DEMO${String(i + 1).padStart(3, "0")}`;
    return {
      id: code,
      code,
      slug: `${type}-${neighborhood}-${code}`,
      isDemo: true,
      purpose: "annual-rent",
      publication: "published",
      available: i !== 13,
      title,
      type,
      typeName: names[type],
      description: `Uma proposta de lar para quem valoriza conforto e uma rotina mais leve. Este ${names[type].toLowerCase()} demonstra como você poderá conhecer os espaços, as características e os custos de uma locação anual com a Adim.\n\nOs ambientes ilustrados foram criados para apresentar a experiência do novo site. Todos os dados deste anúncio são fictícios e não representam uma oferta disponível. Converse com a equipe para conhecer opções reais em ${cityName}.`,
      location: {
        city,
        cityName,
        neighborhood,
        neighborhoodName,
        state: "SC",
        precision: "neighborhood",
      },
      media: media.map((id) => photos[id]),
      costs: {
        rent: rent === null ? null : rent * 100,
        condominium: {
          amount: i === 8 ? 0 : i === 12 ? null : (450 + (i % 4) * 150) * 100,
          period: "monthly",
        },
        iptu: {
          amount: i === 12 ? null : (i % 3 === 0 ? 1440 : 120) * 100,
          period: i % 3 === 0 ? "annual" : "monthly",
        },
      },
      bedrooms,
      suites,
      parking,
      area,
      amenities:
        i % 3 === 0
          ? ["Mobiliado", "Varanda", "Ar-condicionado"]
          : i % 3 === 1
            ? ["Aceita pet", "Varanda"]
            : ["Mobiliado", "Cozinha planejada", "Aceita pet"],
      building:
        type === "casa"
          ? undefined
          : {
              id: `building-${i}`,
              name: `Residencial Exemplo ${i + 1} (fictício)`,
              amenities:
                i % 2 === 0
                  ? ["Elevador", "Piscina", "Academia"]
                  : ["Elevador", "Portaria 24h"],
            },
      publishedAt: `2026-09-${String(17 - i).padStart(2, "0")}T12:00:00-03:00`,
      featured: i < 4,
      badge: i % 3 === 0 ? "Mobiliado" : undefined,
    };
  },
);

export const properties: Property[] = [...imoviewMappedProperties, ...demoProperties];

