import { describe, it, expect } from "vitest";
import { normalizePhone, contentSchema, fieldSchema } from "@/lib/mari/validation";
import { hashPassword, verifyPassword, token, digest } from "@/lib/mari/crypto";
import { defaultContent } from "@/lib/mari/defaults";
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
  });
  it("não permite filtros privados nem seleções sem opções", () => {
    const base = { label: "Vista", type: "boolean", required: false, public: false, filterable: true, options: [] };
    expect(fieldSchema.safeParse(base).success).toBe(false);
    expect(fieldSchema.safeParse({ ...base, public: true }).success).toBe(true);
    expect(fieldSchema.safeParse({ ...base, public: true, type: "select" }).success).toBe(false);
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
