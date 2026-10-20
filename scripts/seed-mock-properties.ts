import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@127.0.0.1:54329/postgres",
  }),
});

const storageRoot = () => resolve(process.env.UPLOAD_DIR || ".data/uploads");

async function prepareImages() {
  await mkdir(storageRoot(), { recursive: true });

  const sourceFiles = [
    { file: "living.png", defaultAlt: "Living amplo e integrado de alto padrão" },
    { file: "balcony.png", defaultAlt: "Sacada gourmet com vista deslumbrante" },
    { file: "bedroom.png", defaultAlt: "Suíte master com closet e acabamento refinado" },
    { file: "dining.png", defaultAlt: "Sala de jantar integrada com espaço gourmet" },
    { file: "coast.png", defaultAlt: "Vista espetacular para a orla e o litoral" },
  ];

  const processedTemplates: { buffer: Buffer; width: number; height: number; size: number; defaultAlt: string }[] = [];

  for (const item of sourceFiles) {
    const filePath = resolve("public/images", item.file);
    const input = await readFile(filePath);
    const encoded = await sharp(input, { limitInputPixels: 40000000 })
      .rotate()
      .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    processedTemplates.push({
      buffer: encoded.data,
      width: encoded.info.width,
      height: encoded.info.height,
      size: encoded.info.size,
      defaultAlt: item.defaultAlt,
    });
  }

  return processedTemplates;
}

async function main() {
  console.log("Iniciando cadastro de imóveis fictícios para Mari Corretora de Imóveis...");

  // 1. Tags
  const tagNames = [
    "Frente mar",
    "Exclusividade",
    "Oportunidade",
    "Abaixo do preço",
    "Aceita permuta",
  ];
  const tagsMap = new Map<string, string>();
  for (const name of tagNames) {
    const t = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagsMap.set(name, t.id);
  }

  // 2. Taxonomias (Categoria e Situação)
  const catResidencial = await db.taxonomy.upsert({
    where: { kind_name: { kind: "category", name: "Residencial" } },
    update: {},
    create: { kind: "category", name: "Residencial" },
  });

  const sitPronto = await db.taxonomy.upsert({
    where: { kind_name: { kind: "situation", name: "Pronto para morar" } },
    update: {},
    create: { kind: "situation", name: "Pronto para morar" },
  });

  const sitLancamento = await db.taxonomy.upsert({
    where: { kind_name: { kind: "situation", name: "Lançamento" } },
    update: {},
    create: { kind: "situation", name: "Lançamento" },
  });

  const sitConstrucao = await db.taxonomy.upsert({
    where: { kind_name: { kind: "situation", name: "Em construção" } },
    update: {},
    create: { kind: "situation", name: "Em construção" },
  });

  // 3. Campos personalizados úteis
  const fieldMar = await db.customField.upsert({
    where: { id: "field_vista_mar" },
    update: { public: true, filterable: true, archived: false },
    create: {
      id: "field_vista_mar",
      label: "Vista para o mar",
      type: "boolean",
      public: true,
      filterable: true,
      required: false,
    },
  });

  const fieldMobiliado = await db.customField.upsert({
    where: { id: "field_mobiliado" },
    update: { public: true, filterable: true, archived: false },
    create: {
      id: "field_mobiliado",
      label: "Mobiliado",
      type: "boolean",
      public: true,
      filterable: true,
      required: false,
    },
  });

  const fieldChurrasqueira = await db.customField.upsert({
    where: { id: "field_churrasqueira" },
    update: { public: true, filterable: true, archived: false },
    create: {
      id: "field_churrasqueira",
      label: "Churrasqueira a carvão",
      type: "boolean",
      public: true,
      filterable: true,
      required: false,
    },
  });

  const fieldDistancia = await db.customField.upsert({
    where: { id: "field_distancia_mar" },
    update: { public: true, filterable: true, archived: false },
    create: {
      id: "field_distancia_mar",
      label: "Distância do mar",
      type: "select",
      public: true,
      filterable: true,
      required: false,
      options: {
        create: [
          { value: "Frente mar" },
          { value: "Segunda quadra" },
          { value: "Até 300m" },
          { value: "Até 500m" },
        ],
      },
    },
    include: { options: true },
  });

  // Limpar campos de teste temporários antigos do e2e se não tiverem valores
  const testFields = await db.customField.findMany({
    where: { label: { contains: "teste" } },
  });
  for (const tf of testFields) {
    const valCount = await db.propertyValue.count({ where: { fieldId: tf.id } });
    if (valCount === 0) {
      await db.customField.delete({ where: { id: tf.id } }).catch(() => {});
    }
  }

  // 4. Preparar imagens
  const templates = await prepareImages();

  // 5. Lista de Imóveis Fictícios de Luxo
  const propertiesData = [
    {
      code: "MARI-BC101",
      slug: "cobertura-duplex-frente-mar-barra-sul-mari-bc101",
      title: "Cobertura Duplex Frente Mar Barra Sul",
      headline: "Exclusividade absoluta e vista cinematográfica de toda a orla",
      purpose: "sale",
      type: "Cobertura",
      status: "published",
      featured: true,
      price: 14900000.0,
      city: "Balneário Camboriú",
      neighborhood: "Barra Sul",
      publicAddress: "Avenida Atlântica, Barra Sul · Balneário Camboriú",
      privateAddress: "Av. Atlântica, 4800, Apto 3201",
      description:
        "Uma das mais extraordinárias coberturas da orla de Balneário Camboriú.\n\nCom piscina privativa aquecida com borda infinita debruçada sobre o mar, terraço gourmet integrado e acabamentos em mármore importado. Suíte master com closet duplo e sala de banho com hidromassagem panorâmica. Edifício icônico com heliponto homologado e infraestrutura de lazer de resort internacional.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      bedrooms: 4,
      suites: 4,
      parking: 4,
      area: 385,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Frente mar", "Exclusividade"],
      customValues: [
        { fieldId: fieldMar.id, value: true },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Frente mar" },
      ],
      imageOrder: [0, 1, 2, 3, 4], // living, balcony, bedroom, dining, coast
    },
    {
      code: "MARI-PB201",
      slug: "apartamento-vista-mar-panoramica-praia-brava-mari-pb201",
      title: "Apartamento Vista Mar Panorâmica Praia Brava",
      headline: "Design contemporâneo a passos da areia no melhor ponto da Brava",
      purpose: "sale",
      type: "Apartamento",
      status: "published",
      featured: true,
      price: 4850000.0,
      city: "Itajaí",
      neighborhood: "Praia Brava",
      publicAddress: "Rua Delfim de Pádua Peixoto, Praia Brava · Itajaí",
      privateAddress: "R. Delfim de Pádua Peixoto, 750, Apto 802",
      description:
        "Apartamento com planta generosa e integração total entre living, cozinha gourmet e ampla sacada envidraçada com vista deslumbrante para as ondas da Praia Brava.\n\nTotalmente decorado e mobiliado com marcenaria planejada de alto padrão e eletrodomésticos embutidos. Condomínio exclusivo com piscina aquecida, spa e espaço fitness premium.",
      videoUrl: "",
      bedrooms: 3,
      suites: 3,
      parking: 3,
      area: 198,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Oportunidade", "Aceita permuta"],
      customValues: [
        { fieldId: fieldMar.id, value: true },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Segunda quadra" },
      ],
      imageOrder: [1, 0, 3, 2, 4], // balcony, living, dining, bedroom, coast
    },
    {
      code: "MARI-BC102",
      slug: "mansao-suspensa-yachthouse-residence-mari-bc102",
      title: "Mansão Suspensa Yachthouse Residence",
      headline: "Andar altíssimo em um dos edifícios mais icônicos da América Latina",
      purpose: "sale",
      type: "Apartamento",
      status: "published",
      featured: true,
      price: 18500000.0,
      city: "Balneário Camboriú",
      neighborhood: "Barra Sul",
      publicAddress: "Avenida Normando Tedesco, Barra Sul · Balneário Camboriú",
      privateAddress: "Av. Normando Tedesco, 100, Torre Sul, Apto 6801",
      description:
        "Viva nas alturas com vista panorâmica de 360 graus para o oceano, a marina e as montanhas.\n\n4 suítes impecáveis, hall privativo com elevador de alta velocidade, aspiração central e automação residencial completa de iluminação e climatização. Condomínio com mais de 10.000 m² de área de lazer e marina integrada.",
      videoUrl: "",
      bedrooms: 4,
      suites: 4,
      parking: 4,
      area: 265,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Frente mar", "Exclusividade"],
      customValues: [
        { fieldId: fieldMar.id, value: true },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Frente mar" },
      ],
      imageOrder: [4, 0, 1, 2, 3], // coast, living, balcony, bedroom, dining
    },
    {
      code: "MARI-BC103",
      slug: "apartamento-alto-padrao-no-centro-de-bc-mari-bc103",
      title: "Apartamento Alto Padrão no Centro de BC",
      headline: "Sofisticação e conforto com locação anual no coração da cidade",
      purpose: "rent",
      type: "Apartamento",
      status: "published",
      featured: true,
      price: 16500.0,
      city: "Balneário Camboriú",
      neighborhood: "Centro",
      publicAddress: "Avenida Brasil, Centro · Balneário Camboriú",
      privateAddress: "Av. Brasil, 2100, Apto 1402",
      description:
        "Disponível para locação anual.\n\nImóvel recém-reformado, completamente climatizado e mobiliado com mobília de excelente qualidade. Living em 3 ambientes com lareira ecológica, cozinha gourmet e suítes com persianas automatizadas. Portaria 24 horas, salão de festas e piscina coletiva.",
      videoUrl: "",
      bedrooms: 3,
      suites: 3,
      parking: 2,
      area: 165,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Oportunidade", "Abaixo do preço"],
      customValues: [
        { fieldId: fieldMar.id, value: false },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Até 300m" },
      ],
      imageOrder: [0, 3, 2, 1, 4], // living, dining, bedroom, balcony, coast
    },
    {
      code: "MARI-BC104",
      slug: "temporada-frente-mar-na-barra-sul-mari-bc104",
      title: "Temporada Frente Mar na Barra Sul",
      headline: "Experiência inesquecível de verão pé na areia com toda a família",
      purpose: "season",
      type: "Apartamento",
      status: "published",
      featured: true,
      price: 3800.0,
      city: "Balneário Camboriú",
      neighborhood: "Barra Sul",
      publicAddress: "Avenida Atlântica, Barra Sul · Balneário Camboriú",
      privateAddress: "Av. Atlântica, 4200, Apto 1001",
      description:
        "Locação de temporada para quem exige o mais alto padrão de conforto e localização privilegiada.\n\nSacada ampla com churrasqueira à carvão voltada de frente para a enseada de Balneário Camboriú. Equipado com enxoval completo, ar-condicionado em todos os cômodos e internet de altíssima velocidade.",
      videoUrl: "",
      bedrooms: 3,
      suites: 3,
      parking: 2,
      area: 175,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Frente mar"],
      customValues: [
        { fieldId: fieldMar.id, value: true },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Frente mar" },
      ],
      imageOrder: [1, 4, 0, 2, 3], // balcony, coast, living, bedroom, dining
    },
    {
      code: "MARI-PB202",
      slug: "penthouse-brava-beach-internacional-mari-pb202",
      title: "Penthouse Brava Beach Internacional",
      headline: "O resort residencial mais premiado e desejado da Praia Brava",
      purpose: "sale",
      type: "Cobertura",
      status: "published",
      featured: true,
      price: 9600000.0,
      city: "Itajaí",
      neighborhood: "Praia Brava",
      publicAddress: "Avenida José Medeiros Vieira, Praia Brava · Itajaí",
      privateAddress: "Av. José Medeiros Vieira, 1800, Cobertura 01",
      description:
        "Cobertura exclusiva pé na areia com vista espetacular para o mar cristalino da Praia Brava.\n\nÁrea externa privativa com deck e jacuzzi aquecida. Ambientes integrados com pé-direito duplo e iluminação zenital. Infraestrutura completa de beach club privado, quadras de tênis, cinema e segurança especializada 24h.",
      videoUrl: "",
      bedrooms: 4,
      suites: 4,
      parking: 4,
      area: 310,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Frente mar", "Exclusividade"],
      customValues: [
        { fieldId: fieldMar.id, value: true },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Frente mar" },
      ],
      imageOrder: [0, 1, 4, 2, 3], // living, balcony, coast, bedroom, dining
    },
    {
      code: "MARI-BC105",
      slug: "apartamento-contemporaneo-pioneiros-mari-bc105",
      title: "Apartamento Contemporâneo Pioneiros",
      headline: "Tranquilidade e proximidade da Roda Gigante e Molhe da Barra Norte",
      purpose: "sale",
      type: "Apartamento",
      status: "published",
      featured: false,
      price: 2950000.0,
      city: "Balneário Camboriú",
      neighborhood: "Pioneiros",
      publicAddress: "Rua Miguel Matte, Pioneiros · Balneário Camboriú",
      privateAddress: "R. Miguel Matte, 350, Apto 701",
      description:
        "Ótima oportunidade em bairro nobre e tranquilo da Barra Norte.\n\nPlanta inteligente com living espaçoso, cozinha americana planejada e sacada integrada com churrasqueira. Prédio novo entregue com padrão de acabamento primoroso e custos condominiais otimizados.",
      videoUrl: "",
      bedrooms: 2,
      suites: 2,
      parking: 2,
      area: 115,
      categoryId: catResidencial.id,
      situationId: sitLancamento.id,
      tags: ["Oportunidade", "Abaixo do preço"],
      customValues: [
        { fieldId: fieldMar.id, value: false },
        { fieldId: fieldMobiliado.id, value: false },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Até 300m" },
      ],
      imageOrder: [0, 2, 3, 1, 4], // living, bedroom, dining, balcony, coast
    },
    {
      code: "MARI-PB203",
      slug: "apartamento-garden-praia-brava-mari-pb203",
      title: "Apartamento Garden Praia Brava",
      headline: "Espaço de casa com a segurança e o lazer de um condomínio fechado",
      purpose: "sale",
      type: "Apartamento",
      status: "published",
      featured: false,
      price: 5300000.0,
      city: "Itajaí",
      neighborhood: "Praia Brava",
      publicAddress: "Rua Luci Canziani, Praia Brava · Itajaí",
      privateAddress: "R. Luci Canziani, 500, Apto 101",
      description:
        "Apartamento Garden com amplo quintal privativo, paisagismo tropical e piscina particular privativa.\n\nPerfeito para famílias com crianças e animais de estimação. Suíte master com acesso direto ao jardim privativo. Imóvel pronto para morar com móveis planejados em todos os cômodos.",
      videoUrl: "",
      bedrooms: 3,
      suites: 3,
      parking: 3,
      area: 235,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Aceita permuta"],
      customValues: [
        { fieldId: fieldMar.id, value: false },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Até 500m" },
      ],
      imageOrder: [1, 0, 2, 3, 4], // balcony, living, bedroom, dining, coast
    },
    {
      code: "MARI-BC106",
      slug: "apartamento-mobiliado-na-av-brasil-mari-bc106",
      title: "Apartamento Mobiliado na Av. Brasil",
      headline: "Locação anual prática e refinada no coração comercial da cidade",
      purpose: "rent",
      type: "Apartamento",
      status: "published",
      featured: false,
      price: 11500.0,
      city: "Balneário Camboriú",
      neighborhood: "Centro",
      publicAddress: "Avenida Brasil, Centro · Balneário Camboriú",
      privateAddress: "Av. Brasil, 1500, Apto 903",
      description:
        "Excelente opção para locação anual.\n\nTotalmente mobiliado, decorado e equipado. Perto de supermercados, farmácias, cafés e a apenas uma quadra do mar. Prédio com salão gourmet, academia e sauna.",
      videoUrl: "",
      bedrooms: 2,
      suites: 2,
      parking: 1,
      area: 95,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Oportunidade"],
      customValues: [
        { fieldId: fieldMar.id, value: false },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: false },
        { fieldId: fieldDistancia.id, value: "Segunda quadra" },
      ],
      imageOrder: [0, 3, 2, 1, 4], // living, dining, bedroom, balcony, coast
    },
    {
      code: "MARI-PB204",
      slug: "refugio-de-temporada-na-praia-brava-mari-pb204",
      title: "Refúgio de Temporada na Praia Brava",
      headline: "Descanse ao som das ondas em um ambiente acolhedor e exclusivo",
      purpose: "season",
      type: "Apartamento",
      status: "published",
      featured: false,
      price: 2700.0,
      city: "Itajaí",
      neighborhood: "Praia Brava",
      publicAddress: "Rua Delfim de Pádua Peixoto, Praia Brava · Itajaí",
      privateAddress: "R. Delfim de Pádua Peixoto, 450, Apto 402",
      description:
        "Apartamento ideal para férias memoráveis em uma das praias mais cobiçadas do litoral catarinense.\n\nClimatizado, com Wi-Fi veloz, churrasqueira privativa na sacada e vaga privativa para dois veículos. A poucos passos da praia e dos melhores beach clubs.",
      videoUrl: "",
      bedrooms: 3,
      suites: 2,
      parking: 2,
      area: 145,
      categoryId: catResidencial.id,
      situationId: sitPronto.id,
      tags: ["Oportunidade"],
      customValues: [
        { fieldId: fieldMar.id, value: true },
        { fieldId: fieldMobiliado.id, value: true },
        { fieldId: fieldChurrasqueira.id, value: true },
        { fieldId: fieldDistancia.id, value: "Segunda quadra" },
      ],
      imageOrder: [1, 4, 0, 3, 2], // balcony, coast, living, dining, bedroom
    },
  ];

  for (const item of propertiesData) {
    console.log(`Processando imóvel: ${item.code} - ${item.title}`);

    // Upsert Property
    const property = await db.property.upsert({
      where: { code: item.code },
      update: {
        slug: item.slug,
        title: item.title,
        headline: item.headline,
        purpose: item.purpose,
        type: item.type,
        status: item.status,
        featured: item.featured,
        price: item.price,
        city: item.city,
        neighborhood: item.neighborhood,
        publicAddress: item.publicAddress,
        privateAddress: item.privateAddress,
        description: item.description,
        videoUrl: item.videoUrl,
        bedrooms: item.bedrooms,
        suites: item.suites,
        parking: item.parking,
        area: item.area,
        categoryId: item.categoryId,
        situationId: item.situationId,
        tags: {
          set: item.tags
            .map((name) => tagsMap.get(name))
            .filter(Boolean)
            .map((id) => ({ id: id! })),
        },
      },
      create: {
        code: item.code,
        slug: item.slug,
        title: item.title,
        headline: item.headline,
        purpose: item.purpose,
        type: item.type,
        status: item.status,
        featured: item.featured,
        price: item.price,
        city: item.city,
        neighborhood: item.neighborhood,
        publicAddress: item.publicAddress,
        privateAddress: item.privateAddress,
        description: item.description,
        videoUrl: item.videoUrl,
        bedrooms: item.bedrooms,
        suites: item.suites,
        parking: item.parking,
        area: item.area,
        categoryId: item.categoryId,
        situationId: item.situationId,
        tags: {
          connect: item.tags
            .map((name) => tagsMap.get(name))
            .filter(Boolean)
            .map((id) => ({ id: id! })),
        },
      },
    });

    // Custom values
    for (const cv of item.customValues) {
      await db.propertyValue.upsert({
        where: {
          propertyId_fieldId: {
            propertyId: property.id,
            fieldId: cv.fieldId,
          },
        },
        update: { value: cv.value },
        create: {
          propertyId: property.id,
          fieldId: cv.fieldId,
          value: cv.value,
        },
      });
    }

    // Gerar imagens salvas em .data/uploads/[key].webp e conectadas ao property
    // Verificar se já possui imagens
    const existingImages = await db.media.findMany({
      where: { propertyId: property.id },
    });

    if (existingImages.length === 0) {
      for (let pos = 0; pos < item.imageOrder.length; pos++) {
        const tIndex = item.imageOrder[pos];
        const template = templates[tIndex];
        const key = `${randomUUID()}.webp`;
        const filePath = resolve(storageRoot(), key);

        await writeFile(filePath, template.buffer, { flag: "wx" });

        await db.media.create({
          data: {
            key,
            alt: `${item.title} · ${template.defaultAlt}`,
            width: template.width,
            height: template.height,
            size: template.size,
            position: pos,
            propertyId: property.id,
          },
        });
      }
    }
  }

  const finalCount = await db.property.count();
  console.log(`\nConcluído com sucesso! Total de imóveis no banco: ${finalCount}`);
}

main()
  .catch((err) => {
    console.error("Erro ao cadastrar imóveis fictícios:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

