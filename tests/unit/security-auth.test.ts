import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  verifyPassword: vi.fn(),
  findAdmin: vi.fn(),
  createSession: vi.fn(),
  deleteSessions: vi.fn(),
  setCookie: vi.fn(),
  getCookie: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: mocks.getCookie,
    set: mocks.setCookie,
    delete: vi.fn(),
  }),
}));
vi.mock("@/lib/mari/db", () => ({
  db: {
    admin: { findUnique: mocks.findAdmin, update: vi.fn() },
    session: {
      findUnique: vi.fn(),
      create: mocks.createSession,
      deleteMany: mocks.deleteSessions,
    },
  },
}));
vi.mock("@/lib/mari/crypto", () => ({
  digest: (value: string) => `digest:${value}`,
  token: () => "session-token",
  hashPassword: vi.fn(),
  verifyPassword: mocks.verifyPassword,
}));
vi.mock("@/lib/mari/http", () => ({
  requestIp: () => "203.0.113.7",
  rateLimit: mocks.rateLimit,
  assert: (value: unknown, status: number, message: string) => {
    if (!value) throw Object.assign(new Error(message), { status });
  },
}));
vi.mock("@/config/deployment", () => ({
  isProductionDeployment: () => false,
}));

import { adminLogin } from "@/lib/mari/auth";

const request = new Request("https://mari.example/api/admin/login");
const admin = {
  id: "admin-1",
  email: "mari@admin.com.br",
  passwordHash: "stored-hash",
  mustChangePassword: false,
};

describe("limites do login administrativo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findAdmin.mockResolvedValue(admin);
    mocks.createSession.mockResolvedValue({});
    mocks.deleteSessions.mockResolvedValue({});
  });

  it("não deixa tentativas de terceiros bloquearem uma senha correta", async () => {
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.rateLimit.mockImplementation(async (key: string) => {
      if (key === "admin:mari@admin.com.br")
        throw Object.assign(new Error("Muitas tentativas."), { status: 429 });
    });

    await expect(
      adminLogin(
        { email: "MARI@ADMIN.COM.BR", password: "correta" },
        request,
      ),
    ).resolves.toEqual({ ok: true, mustChangePassword: false });

    expect(mocks.verifyPassword).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimit).toHaveBeenCalledWith("admin-ip:203.0.113.7", 30);
    expect(mocks.rateLimit).not.toHaveBeenCalledWith(
      "admin:mari@admin.com.br",
      8,
    );
  });

  it("contabiliza a conta somente depois de uma falha e mantém erro genérico", async () => {
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(
      adminLogin(
        { email: "mari@admin.com.br", password: "incorreta" },
        request,
      ),
    ).rejects.toMatchObject({
      status: 401,
      message: "E-mail ou senha incorretos.",
    });

    expect(mocks.verifyPassword).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimit.mock.calls).toEqual([
      ["admin-ip:203.0.113.7", 30],
      ["admin:mari@admin.com.br", 8],
    ]);
  });

  it("mantém uma verificação de custo equivalente para conta inexistente", async () => {
    mocks.findAdmin.mockResolvedValue(null);
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(
      adminLogin(
        { email: "inexistente@example.com", password: "incorreta" },
        request,
      ),
    ).rejects.toMatchObject({
      status: 401,
      message: "E-mail ou senha incorretos.",
    });

    expect(mocks.verifyPassword).toHaveBeenCalledTimes(1);
    expect(mocks.verifyPassword.mock.calls[0][1]).toContain(":");
    expect(mocks.rateLimit.mock.calls).toEqual([
      ["admin-ip:203.0.113.7", 30],
      ["admin:inexistente@example.com", 8],
    ]);
  });
});
