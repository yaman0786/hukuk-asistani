import { describe, it, expect } from "vitest";
import { limitsForTier, checkQuota, TIER_LIMITS } from "./rate-limits";

describe("limitsForTier", () => {
  it("bilinmeyen/boş tier free kabul edilir", () => {
    expect(limitsForTier(null)).toEqual(TIER_LIMITS.free);
    expect(limitsForTier("bilinmiyor")).toEqual(TIER_LIMITS.free);
  });

  it("pro ve kurumsal kendi limitlerini alır", () => {
    expect(limitsForTier("pro")).toEqual({ hour: 120, day: 2000 });
    expect(limitsForTier("kurumsal")).toEqual({ hour: 600, day: 10000 });
  });
});

describe("checkQuota", () => {
  it("limit altındaki kullanım serbesttir", () => {
    expect(checkQuota("free", 19, 199)).toEqual({ allowed: true });
  });

  it("saatlik limitte engeller", () => {
    expect(checkQuota("free", 20, 0)).toEqual({
      allowed: false,
      scope: "hour",
      limit: 20,
      retryAfterSeconds: 3600,
    });
  });

  it("günlük limitte engeller", () => {
    expect(checkQuota("free", 0, 200)).toEqual({
      allowed: false,
      scope: "day",
      limit: 200,
      retryAfterSeconds: 86400,
    });
  });

  it("saatlik limit günlükten önce değerlendirilir", () => {
    const v = checkQuota("pro", 120, 2000);
    expect(v.allowed).toBe(false);
    expect(v.allowed === false && v.scope).toBe("hour");
  });

  it("kurumsal kullanıcı free limitlerini aşabilir", () => {
    expect(checkQuota("kurumsal", 100, 500)).toEqual({ allowed: true });
  });
});
