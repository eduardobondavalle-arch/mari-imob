import { describe, expect, it } from "vitest";
import { isProductionDeployment } from "@/config/deployment";

describe("deployment classification", () => {
  it("recognizes explicit and Vercel production deployments", () => {
    expect(isProductionDeployment({ APP_ENV: "production" })).toBe(true);
    expect(isProductionDeployment({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("keeps local, preview and demo environments out of public indexing", () => {
    expect(isProductionDeployment({})).toBe(false);
    expect(isProductionDeployment({ APP_ENV: "development" })).toBe(false);
    expect(isProductionDeployment({ VERCEL_ENV: "preview" })).toBe(false);
    expect(
      isProductionDeployment({
        APP_ENV: "production",
        VERCEL_ENV: "preview",
      }),
    ).toBe(false);
  });
});
