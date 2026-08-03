import { describe, it, expect } from "vitest";
import { extractCitations } from "./citations";

describe("extractCitations", () => {
  it("returns empty for plain text", () => {
    expect(extractCitations("bir hukuki metin")).toEqual([]);
  });

  it("parses mevzuat kaynak", () => {
    const out = extractCitations("Karar [Kaynak: TBK m. 49] uyarınca...");
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("mevzuat");
    expect(out[0].label).toBe("TBK m. 49");
    expect(out[0].href).toContain("google.com/search");
    expect(out[0].href).toContain(encodeURIComponent("mevzuat.gov.tr TBK m. 49"));
  });

  it("parses ictihat E./K. pattern", () => {
    const out = extractCitations("[Kaynak: Y9HD E.2020/1234 K.2021/567]");
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("ictihat");
    expect(out[0].href).toContain("karararama.yargitay.gov.tr");
  });

  it("deduplicates identical markers", () => {
    const out = extractCitations("[Kaynak: TMK 166] ve tekrar [Kaynak: TMK 166]");
    expect(out).toHaveLength(1);
  });

  it("captures Genel İlke marker once", () => {
    const out = extractCitations("[Genel İlke] iyi niyet. [Genel İlke]");
    expect(out.filter((c) => c.kind === "genel")).toHaveLength(1);
  });

  it("mixed markers preserve order and count", () => {
    const out = extractCitations("[Kaynak: TBK 27] önce, sonra [Kaynak: Y2HD E.2019/1 K.2020/2]");
    expect(out).toHaveLength(2);
    expect(out[0].kind).toBe("mevzuat");
    expect(out[1].kind).toBe("ictihat");
  });
});
