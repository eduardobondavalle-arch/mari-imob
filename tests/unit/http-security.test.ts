import { afterEach, describe, expect, it, vi } from "vitest";
import { requestIp } from "@/lib/mari/http";

const request = (headers: Record<string, string>) =>
  new Request("https://mari.example/api/contact", { headers });

describe.sequential("trusted client IP resolution", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("trusts only Vercel's validated forwarding header on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TRUST_PROXY", "true");

    expect(
      requestIp(
        request({
          "x-vercel-forwarded-for": "203.0.113.20",
          "x-forwarded-for": "198.51.100.99",
        }),
      ),
    ).toBe("203.0.113.20");
  });

  it("uses a conservative bucket for a missing or invalid Vercel IP", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TRUST_PROXY", "true");

    expect(
      requestIp(
        request({
          "x-vercel-forwarded-for": "not-an-ip",
          "x-forwarded-for": "203.0.113.21",
        }),
      ),
    ).toBe("unknown");
  });

  it("accepts X-Forwarded-For only for an explicitly trusted proxy", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUST_PROXY", "true");

    expect(
      requestIp(
        request({ "x-forwarded-for": "2001:db8::7, 192.0.2.10" }),
      ),
    ).toBe("2001:db8::7");
    expect(requestIp(request({ "x-forwarded-for": "999.1.1.1" }))).toBe(
      "unknown",
    );
  });

  it("ignores forwarding headers without an explicit trust boundary", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUST_PROXY", "false");

    expect(
      requestIp(
        request({
          "x-vercel-forwarded-for": "203.0.113.22",
          "x-forwarded-for": "203.0.113.23",
        }),
      ),
    ).toBe("unknown");
  });
});
