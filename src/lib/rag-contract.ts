/**
 * Server-side answer safety helpers.
 * This is intentionally deterministic: it never decides whether a legal claim
 * is true; it only detects when a response needs human/source verification.
 */
const SPECIFIC_LEGAL_CLAIM =
  /(?:madd(?:esi|e)|kanun|yönetmelik|tebliğ|karar|esas|süre|gün|ay|yıl|harç|parasal sınır)/iu;
const SOURCE_MARKER = /\[(?:Kaynak|Genel İlke)(?::[^\]]+)?\]/iu;

export type GroundingAssessment = {
  hasSourceMarker: boolean;
  requiresVerification: boolean;
  reason: "grounded" | "general" | "specific-claim-without-source" | "empty";
};

export function assessGrounding(answer: string): GroundingAssessment {
  const text = answer.trim();
  if (!text) {
    return { hasSourceMarker: false, requiresVerification: true, reason: "empty" };
  }
  const hasSourceMarker = SOURCE_MARKER.test(text);
  if (hasSourceMarker) {
    return { hasSourceMarker: true, requiresVerification: false, reason: "grounded" };
  }
  if (SPECIFIC_LEGAL_CLAIM.test(text)) {
    return {
      hasSourceMarker: false,
      requiresVerification: true,
      reason: "specific-claim-without-source",
    };
  }
  return { hasSourceMarker: false, requiresVerification: false, reason: "general" };
}
