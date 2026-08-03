import { describe, it, expect } from "vitest";
import { cooldownForStrikes } from "./abuse-guard.server";

describe("cooldownForStrikes", () => {
  it("no cooldown under 3 strikes", () => {
    expect(cooldownForStrikes(0)).toBe(0);
    expect(cooldownForStrikes(2)).toBe(0);
  });
  it("5 minutes for 3-4 strikes", () => {
    expect(cooldownForStrikes(3)).toBe(5 * 60 * 1000);
    expect(cooldownForStrikes(4)).toBe(5 * 60 * 1000);
  });
  it("30 minutes for 5-7 strikes", () => {
    expect(cooldownForStrikes(5)).toBe(30 * 60 * 1000);
    expect(cooldownForStrikes(7)).toBe(30 * 60 * 1000);
  });
  it("2 hours for 8-11 strikes", () => {
    expect(cooldownForStrikes(8)).toBe(2 * 60 * 60 * 1000);
    expect(cooldownForStrikes(11)).toBe(2 * 60 * 60 * 1000);
  });
  it("24 hours for 12+ strikes", () => {
    expect(cooldownForStrikes(12)).toBe(24 * 60 * 60 * 1000);
    expect(cooldownForStrikes(50)).toBe(24 * 60 * 60 * 1000);
  });
  it("monotonically non-decreasing", () => {
    let prev = -1;
    for (let s = 0; s < 20; s++) {
      const c = cooldownForStrikes(s);
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
  });
});
