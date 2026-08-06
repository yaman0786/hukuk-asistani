import { describe, expect, it } from "vitest";
import { assessGrounding } from "./rag-contract";

describe("assessGrounding", () => {
  it("marks sourced legal answers as grounded", () => {
    expect(assessGrounding("TMK 166 uygulanır. [Kaynak: TMK m.166]")).toMatchObject({
      requiresVerification: false,
      reason: "grounded",
    });
  });

  it("flags specific legal claims without a source", () => {
    expect(assessGrounding("Bu süre 10 gündür.")).toMatchObject({
      requiresVerification: true,
      reason: "specific-claim-without-source",
    });
  });

  it("does not over-flag general explanations", () => {
    expect(assessGrounding("Taraflar delillerini açık ve düzenli sunmalıdır.")).toMatchObject({
      requiresVerification: false,
      reason: "general",
    });
  });
});
