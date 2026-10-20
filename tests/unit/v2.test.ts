import { describe,it,expect } from "vitest";
import { fromZonedInput, zonedInput, shiftDay } from "../../src/lib/mari/time";
import { allowedOrigin } from "../../src/lib/mari/request-origin";
describe("Brasília calendar dates",()=>{
  it("stores UTC and displays the same local time across month and year boundaries",()=>{
    expect(fromZonedInput("2026-12-31T23:30")).toBe("2027-01-01T02:30:00.000Z");
    expect(zonedInput("2027-01-01T02:30:00Z")).toBe("2026-12-31T23:30");
    expect(shiftDay("2028-02-28",1)).toBe("2028-02-29");
  });
  it("uses timezone rules for older daylight saving dates",()=>{
    expect(fromZonedInput("2018-12-12T14:00")).toBe("2018-12-12T16:00:00.000Z");
  });
});
describe("local admin login origin",()=>{
  it("accepts equivalent loopback hosts only in development and on the configured port",()=>{
    expect(allowedOrigin("http://localhost:3000","http://127.0.0.1:3000","development")).toBe(true);
    expect(allowedOrigin("http://localhost:3001","http://127.0.0.1:3000","development")).toBe(false);
    expect(allowedOrigin("http://localhost:3000","http://127.0.0.1:3000","production")).toBe(false);
    expect(allowedOrigin("https://evil.invalid","http://127.0.0.1:3000","development")).toBe(false);
    expect(allowedOrigin(null,"http://127.0.0.1:3000","development")).toBe(false);
  });
});
