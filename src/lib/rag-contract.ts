/**
 * A citation marker is model-generated text, not evidence that a legal source
 * was retrieved, authenticated, current, or supports the claim.
 * This helper deliberately never marks a legal claim as source-verified.
 */
const SPECIFIC_LEGAL_CLAIM =
  /(?:madd(?:esi|e)|kanun|yönetmelik|tebliğ|karar|esas|süre|gün|ay|yıl|harç|parasal sınır)/iu;
const SOURCE_MARKER = /\[(?:Kaynak(?::[^\]]+)?|Genel İlke)\]/iu;

export type GroundingAssessment = {
  hasSourceMarker: boolean;
  requiresVerification: boolean;
  reason: "unverified-source-marker" | "general" | "specific-claim-without-source" | "empty";
};

export function assessGrounding(answer: string): GroundingAssessment {
  const text = answer.trim();
  if (!text) {
    return { hasSourceMarker: false, requiresVerification: true, reason: "empty" };
  }
  const hasSourceMarker = SOURCE_MARKER.test(text);
  if (hasSourceMarker) {
    return { hasSourceMarker: true, requiresVerification: true, reason: "unverified-source-marker" };
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
