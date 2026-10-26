import { z } from "zod";
export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits))
    throw new Error("Informe um telefone brasileiro válido com DDD.");
  return digits;
}
export const phoneSchema = z
  .string()
  .max(30)
  .transform((v, ctx) => {
    try {
      return normalizePhone(v);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Informe um telefone válido com DDD.",
      });
      return z.NEVER;
    }
  });
export const identitySchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  phone: phoneSchema,
  consent: z.literal(true),
  propertyId: z.string().max(100).optional(),
  purpose: z.enum(["sale", "rent", "season"]).optional(),
});
const httpsUrlSchema = z
  .string()
  .max(300)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
      return false;
    }
  }, "Utilize um endereço HTTPS.");
export const optionalHttpsUrlSchema = z.union([
  z.literal(""),
  httpsUrlSchema,
]);
export const internalOrHttpsUrlSchema = z
  .string()
  .min(1)
  .max(300)
  .refine(
    (value) =>
      (/^\/(?!\/)[^\u0000-\u001f\u007f\\]*$/.test(value) &&
        !value.includes("\\")) ||
      httpsUrlSchema.safeParse(value).success,
    "Utilize um caminho interno ou endereço HTTPS.",
  );
export function safeHttpsUrl(value: unknown) {
  const parsed = optionalHttpsUrlSchema.safeParse(value);
  return parsed.success ? parsed.data : "";
}
export function safeInternalOrHttpsUrl(value: unknown, fallback: string) {
  const parsed = internalOrHttpsUrlSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
export const ownerSubmissionSchema = z
  .object({
    firstName: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    purpose: z.enum(["sale", "rent"]),
    propertyType: z.string().trim().min(2).max(60),
    city: z.string().trim().min(2).max(100),
    neighborhood: z.string().trim().min(2).max(100),
    location: z.string().trim().max(250).default(""),
    area: z.number().min(0).max(1000000).nullable(),
    bedrooms: z.number().int().min(0).max(100).nullable(),
    askingPrice: z.number().min(0).max(999999999999).nullable(),
    notes: z.string().trim().max(5000).default(""),
    consent: z.literal(true),
  })
  .strict();
const optionalNumber = z.number().finite().min(0).max(1000000).nullable();
export const propertySchema = z.object({
  title: z.string().trim().min(5).max(180),
  headline: z.string().trim().max(220).default(""),
  purpose: z.enum(["sale", "rent", "season"]).default("sale"),
  type: z.string().trim().min(2).max(60),
  status: z.enum(["draft", "published", "hidden", "sold", "rented"]),
  featured: z.boolean(),
  superFeatured: z.boolean().default(false),
  price: z.number().finite().min(0).max(999999999999).nullable(),
  offers: z.array(z.object({
    purpose: z.enum(["sale", "rent", "season"]),
    price: z.number().finite().min(0).max(999999999999).nullable(),
    active: z.boolean().default(true),
  })).min(1).max(3).optional(),
  condominiumFee: z.number().finite().min(0).max(999999999999).nullable().default(null),
  condominiumPeriod: z.enum(["monthly", "annual"]).nullable().default(null),
  iptuFee: z.number().finite().min(0).max(999999999999).nullable().default(null),
  iptuPeriod: z.enum(["monthly", "annual"]).nullable().default(null),
  trashFee: z.number().finite().min(0).max(999999999999).nullable().default(null),
  trashPeriod: z.enum(["monthly", "annual"]).nullable().default(null),
  otherFees: z.number().finite().min(0).max(999999999999).nullable().default(null),
  otherFeesPeriod: z.enum(["monthly", "annual"]).nullable().default(null),
  otherFeesDescription: z.string().trim().max(500).default(""),
  city: z.string().trim().min(2).max(100),
  neighborhood: z.string().trim().min(2).max(100),
  publicAddress: z.string().trim().max(250).default(""),
  privateAddress: z.string().trim().max(300).default(""),
  description: z.string().trim().min(10).max(20000),
  videoUrl: z
    .union([
      z.literal(""),
      z
        .url()
        .refine((v) => /^https:\/\//.test(v), "Utilize um endereço HTTPS."),
    ])
    .default(""),
  bedrooms: optionalNumber.refine((v) => v === null || Number.isInteger(v)),
  suites: optionalNumber.refine((v) => v === null || Number.isInteger(v)),
  bathrooms: optionalNumber.refine((v) => v === null || Number.isInteger(v)).default(null),
  parking: optionalNumber.refine((v) => v === null || Number.isInteger(v)),
  area: optionalNumber,
  builtArea: optionalNumber.default(null),
  landArea: optionalNumber.default(null),
  condominiumId: z.string().nullable().default(null),
  categoryId: z.string().nullable().default(null),
  situationId: z.string().nullable().default(null),
  tagIds: z.array(z.string()).max(30),
  imageIds: z.array(z.string()).max(40),
  customValues: z.record(
    z.string(),
    z.union([
      z.string().max(10000),
      z.number().finite(),
      z.boolean(),
      z.array(z.string().max(100)).max(100),
      z.null(),
    ]),
  ),
});
export const condominiumSchema = z.object({
  name: z.string().trim().min(2).max(140),
  city: z.string().trim().min(2).max(100),
  neighborhood: z.string().trim().min(2).max(100),
  street: z.string().trim().min(2).max(180),
  number: z.string().trim().min(1).max(30),
  complement: z.string().trim().max(120).default(""),
  postalCode: z.string().trim().max(12).default("").refine((value) => !value || /^\d{5}-?\d{3}$/.test(value), "Informe um CEP válido."),
  description: z.string().trim().max(10000).default(""),
  amenities: z.array(z.string().trim().min(2).max(80)).max(100),
  imageIds: z.array(z.string()).max(60),
  archived: z.boolean().default(false),
});
export const fieldSchema = z
  .object({
    label: z.string().trim().min(2).max(80),
    type: z.enum([
      "text",
      "textarea",
      "number",
      "money",
      "boolean",
      "select",
      "multiselect",
      "date",
    ]),
    required: z.boolean(),
    public: z.boolean(),
    filterable: z.boolean(),
    options: z.array(z.string().trim().min(1).max(100)).max(100),
  })
  .refine((v) => !v.filterable || v.public, "Um filtro precisa ser público.")
  .refine(
    (v) => !["select", "multiselect"].includes(v.type) || v.options.length > 0,
    "Adicione as opções do campo.",
  );
const imageUrl = z
  .string()
  .max(300)
  .refine(
    (v) =>
      v === "" ||
      /^\/media\/[a-f0-9-]+\.webp$/.test(v) ||
      /^\/brand\/[a-z0-9-]+\.(?:png|webp)$/.test(v) ||
      ["/mari-portrait.png", "/mari-portrait.webp", "/images/coast.png", "/images/coast.webp"].includes(v),
    "Use uma imagem enviada pelo painel.",
  );
export const contentSchema = z.object({
  brandName: z.string().trim().min(1).max(60),
  logo: imageUrl,
  favicon: imageUrl,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  heroImage: imageUrl,
  heroTitle: z.string().min(1).max(180),
  heroSubtitle: z.string().max(500),
  featuredTitle: z.string().min(1).max(180),
  aboutTitle: z.string().min(1).max(180),
  aboutEyebrow: z.string().min(1).max(120),
  aboutText: z.string().max(5000),
  aboutImage: imageUrl,
  aboutButtonText: z.string().min(1).max(80),
  aboutButtonUrl: internalOrHttpsUrlSchema,
  contactTitle: z.string().min(1).max(200),
  footerText: z.string().max(1000),
  whatsapp: z.string().regex(/^55[1-9]\d\d{8,9}$/, "Informe DDI, DDD e telefone, somente números."),
  whatsappPhoto: imageUrl,
  whatsappMessage: z.string().max(500),
  whatsappEnabled: z.boolean(),
  instagram: optionalHttpsUrlSchema,
  facebook: optionalHttpsUrlSchema,
  youtube: optionalHttpsUrlSchema,
  linkedin: optionalHttpsUrlSchema,
  creci: z.string().max(100),
  professionalInfo: z.string().max(500),
});
