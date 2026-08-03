import { describe, it, expect } from "vitest";
import { CASE_LAW_CORPUS } from "@/data/case-law-corpus";
import { LEGAL_CORPUS } from "@/data/legal-corpus";

describe("içtihat arşivi", () => {
  it("yeterli sayıda kayıt içerir", () => {
    expect(CASE_LAW_CORPUS.length).toBeGreaterThanOrEqual(30);
  });

  it("her kaydın kind alanı ictihat", () => {
    expect(CASE_LAW_CORPUS.every((e) => e.kind === "ictihat")).toBe(true);
  });

  it("(code, article_no) anahtarları benzersizdir", () => {
    const keys = CASE_LAW_CORPUS.map((e) => `${e.code}|${e.article_no}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("kanun korpusuyla anahtar çakışması yoktur", () => {
    const lawKeys = new Set(LEGAL_CORPUS.map((e) => `${e.code}|${e.article_no}`));
    const clash = CASE_LAW_CORPUS.filter((e) => lawKeys.has(`${e.code}|${e.article_no}`));
    expect(clash).toEqual([]);
  });

  it("içerikler embedding için anlamlı uzunlukta ve kaynak referanslı", () => {
    for (const e of CASE_LAW_CORPUS) {
      expect(e.title.length).toBeGreaterThan(8);
      expect(e.content.length).toBeGreaterThan(120);
      expect(e.content.length).toBeLessThan(6000);
      expect(e.ref.trim()).not.toBe("");
    }
  });
});
