import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadMedia: vi.fn(),
  requireAdmin: vi.fn(),
  rateLimit: vi.fn(),
  readJson: vi.fn(),
  saveConsultation: vi.fn(),
}));
const functions = vi.hoisted(
  () => (names: string[]) =>
    Object.fromEntries(names.map((name) => [name, vi.fn()])),
);

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mari/db", () => ({ db: {} }));
vi.mock("@/lib/mari/http", () => {
  class TestHttpError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return {
    assert: (value: unknown, status: number, message: string) => {
      if (!value) throw new TestHttpError(status, message);
    },
    checkOrigin: vi.fn(),
    readJson: mocks.readJson,
    rateLimit: mocks.rateLimit,
    requestIp: () => "203.0.113.7",
    errorResponse: (error: unknown) => {
      const result = error as TestHttpError;
      return Response.json(
        { error: result.message },
        { status: result.status || 500 },
      );
    },
  };
});
vi.mock("@/lib/mari/auth", () => ({
  ...functions(["adminLogin", "changePassword", "logout"]),
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/mari/client-service", () =>
  functions([
    "clientState",
    "registerSelection",
    "changeSelection",
    "contactRequest",
    "sharedSelection",
    "deleteAccount",
  ]),
);
vi.mock("@/lib/mari/admin-service", () =>
  functions([
    "adminProperties",
    "dashboard",
    "leadDetail",
    "leadList",
    "saveContent",
    "saveField",
    "saveProperty",
    "settingsData",
  ]),
);
vi.mock("@/lib/mari/catalog", () =>
  functions(["getListing", "searchCatalog"]),
);
vi.mock("@/lib/mari/storage", () => ({
  uploadMedia: mocks.uploadMedia,
  deleteMedia: vi.fn(),
}));
vi.mock("@/lib/mari/crm-service", () =>
  functions([
    "board",
    "saveStage",
    "reorderStages",
    "deleteStage",
    "moveLead",
    "manualLead",
    "leadExtras",
    "saveComment",
    "saveAdminSelection",
    "funnelSummary",
  ]),
);
vi.mock("@/lib/mari/agenda-service", () =>
  functions(["appointments", "appointmentDetail", "saveAppointment"]),
);
vi.mock("@/lib/mari/consultation", async () => {
  const { z } = await import("zod");
  return {
    consultationSchema: z.object({ phone: z.string() }).passthrough(),
    saveConsultation: mocks.saveConsultation,
  };
});
vi.mock("@/lib/mari/owner-service", () =>
  functions([
    "saveOwnerSubmission",
    "ownerSubmissions",
    "convertOwnerSubmission",
  ]),
);
vi.mock("@/lib/mari/news-service", () =>
  functions(["adminNews", "saveNews", "deleteNews"]),
);

import { POST } from "@/app/api/[...path]/route";

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("superfície de upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });
    mocks.uploadMedia.mockResolvedValue({ id: "media-1" });
    mocks.saveConsultation.mockResolvedValue({ ok: true });
  });

  it("não oferece upload público para proprietários", async () => {
    const response = await POST(
      new Request("https://mari.example/api/owner-upload", { method: "POST" }),
      context(["owner-upload"]),
    );

    expect(response.status).toBe(404);
    expect(mocks.uploadMedia).not.toHaveBeenCalled();
  });

  it("preserva o upload autenticado do painel", async () => {
    const response = await POST(
      new Request("https://mari.example/api/admin/upload", { method: "POST" }),
      context(["admin", "upload"]),
    );

    expect(response.status).toBe(200);
    expect(mocks.requireAdmin).toHaveBeenCalled();
    expect(mocks.uploadMedia).toHaveBeenCalledTimes(1);
  });

  it("limita consultorias pelo telefone normalizado além do IP", async () => {
    mocks.readJson.mockResolvedValue({ phone: "5547999991234" });
    const response = await POST(
      new Request("https://mari.example/api/consultation", { method: "POST" }),
      context(["consultation"]),
    );

    expect(response.status).toBe(200);
    expect(mocks.rateLimit.mock.calls).toEqual([
      ["consultation:203.0.113.7", 10],
      ["consultation-phone:5547999991234", 6, 3600],
    ]);
    expect(mocks.saveConsultation).toHaveBeenCalledWith({
      phone: "5547999991234",
    });
  });
});
