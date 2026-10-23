import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  contentSchema,
  fieldSchema,
  ownerSubmissionSchema,
  optionalHttpsUrlSchema,
  safeHttpsUrl,
  safeInternalOrHttpsUrl,
} from "@/lib/mari/validation";
import { hashPassword, verifyPassword, token, digest } from "@/lib/mari/crypto";
import { defaultContent } from "@/lib/mari/defaults";
import { initialAdminCredentials } from "@/lib/mari/initial-admin";
describe("normalização e validação", () => {
  it("normaliza formatos equivalentes e rejeita números inválidos", () => {
    expect(normalizePhone("(47) 99999-1234")).toBe("5547999991234");
    expect(normalizePhone("+55 47 99999-1234")).toBe("5547999991234");
    expect(() => normalizePhone("47 8916-8857")).toThrow();
    expect(() => normalizePhone("123")).toThrow();
    expect(() => normalizePhone("00 12345-6789")).toThrow();
  });
  it("recusa URLs executáveis, imagens externas e cores que injetariam CSS", () => {
    expect(contentSchema.safeParse({ ...defaultContent, instagram: "javascript:alert(1)" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...defaultContent, heroImage: "https://external.test/x.jpg" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...defaultContent, primaryColor: "red;display:none" }).success).toBe(false);
    for (const key of ["instagram", "facebook", "youtube", "linkedin"] as const) {
      expect(contentSchema.safeParse({ ...defaultContent, [key]: "javascript:alert(1)" }).success).toBe(false);
      expect(contentSchema.safeParse({ ...defaultContent, [key]: "http://example.test/profile" }).success).toBe(false);
    }
    expect(contentSchema.safeParse({ ...defaultContent, aboutButtonUrl: "//evil.example/path" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...defaultContent, aboutButtonUrl: "data:text/html,test" }).success).toBe(false);
    expect(contentSchema.safeParse({ ...defaultContent, aboutButtonUrl: "/contato" }).success).toBe(true);
    expect(optionalHttpsUrlSchema.safeParse("https://example.test/fonte").success).toBe(true);
    expect(optionalHttpsUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeHttpsUrl("javascript:alert(1)")).toBe("");
    expect(safeInternalOrHttpsUrl("//evil.example", "/contato")).toBe("/contato");
  });
  it("não aceita identificadores de fotos no formulário público de proprietários", () => {
    const submission = {
      firstName: "Maria",
      phone: "(47) 99999-1234",
      purpose: "sale",
      propertyType: "Apartamento",
      city: "Itajaí",
      neighborhood: "Praia Brava",
      location: "",
      area: null,
      bedrooms: null,
      askingPrice: null,
      notes: "",
      consent: true,
    };
    expect(ownerSubmissionSchema.safeParse(submission).success).toBe(true);
    expect(ownerSubmissionSchema.safeParse({ ...submission, photoIds: ["orphan-media-id"] }).success).toBe(false);
  });
  it("não permite filtros privados nem seleções sem opções", () => {
    const base = { label: "Vista", type: "boolean", required: false, public: false, filterable: true, options: [] };
    expect(fieldSchema.safeParse(base).success).toBe(false);
    expect(fieldSchema.safeParse({ ...base, public: true }).success).toBe(true);
    expect(fieldSchema.safeParse({ ...base, public: true, type: "select" }).success).toBe(false);
  });
});
describe("inicialização administrativa segura", () => {
  it("exige senha explícita e forte em todos os ambientes", () => {
    expect(() => initialAdminCredentials({ APP_ENV: "development" })).toThrow("INITIAL_ADMIN_PASSWORD");
    expect(() => initialAdminCredentials({ VERCEL_ENV: "preview", INITIAL_ADMIN_PASSWORD: "Admin" })).toThrow("INITIAL_ADMIN_PASSWORD");
    expect(() => initialAdminCredentials({ APP_ENV: "test", INITIAL_ADMIN_PASSWORD: "curta" })).toThrow("INITIAL_ADMIN_PASSWORD");
    expect(initialAdminCredentials({ INITIAL_ADMIN_EMAIL: " MARI@ADMIN.COM.BR ", INITIAL_ADMIN_PASSWORD: "Senha-Longa-123" })).toEqual({ email: "mari@admin.com.br", password: "Senha-Longa-123" });
  });
});
describe("segredos de autenticação", () => {
  it("usa salt único e rejeita senhas incorretas", async () => {
    const first = await hashPassword("senha-de-teste-segura");
    const second = await hashPassword("senha-de-teste-segura");
    expect(first).not.toBe(second);
    expect(await verifyPassword("senha-de-teste-segura", first)).toBe(true);
    expect(await verifyPassword("incorreta", first)).toBe(false);
  });
  it("gera tokens aleatórios e guarda somente resumos", () => { const raw = token(); expect(raw).toHaveLength(64); expect(token()).not.toBe(raw); expect(digest(raw)).not.toBe(raw); });
});
