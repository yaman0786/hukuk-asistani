import { describe, expect, it } from "vitest";
import { assessGrounding } from "./rag-contract";

describe("assessGrounding", () => {
  it("does not treat an unverified citation as verified evidence", () => {
    expect(assessGrounding("TMK 166 uygulanır. [Kaynak: TMK m.166]")).toMatchObject({
      hasSourceMarker: true,
      requiresVerification: true,
      reason: "unverified-source-marker",
    });
  });

  it("does not treat a fabricated court reference as proof", () => {
    expect(assessGrounding("Yargıtay E.2024/123 K.2025/456 [Kaynak: Yargıtay E.2024/123]")).toMatchObject({
      requiresVerification: true,
    });
  });

  it("does not treat a general principle marker as a verified source", () => {
    expect(assessGrounding("Bu bir genel ilkedir. [Genel İlke]")).toMatchObject({
      requiresVerification: true,
      reason: "unverified-source-marker",
    });
  });

  it("flags specific legal claims without a source", () => {
    expect(assessGrounding("Bu süre 10 gündür.")).toMatchObject({
      requiresVerification: true,
      reason: "specific-claim-without-source",
    });
  });

  it("does not over-flag general explanations without legal specifics", () => {
    expect(assessGrounding("Taraflar delillerini açık ve düzenli sunmalıdır.")).toMatchObject({
      requiresVerification: false,
      reason: "general",
    });
  });

  it("flags empty responses", () => {
    expect(assessGrounding("  ")).toMatchObject({ requiresVerification: true, reason: "empty" });
  });
});
