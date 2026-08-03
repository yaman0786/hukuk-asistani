/** Tier bazlı mesaj kotaları (saatlik / günlük). Saf fonksiyon — test edilebilir. */
export type Tier = "free" | "pro" | "kurumsal";

export const TIER_LIMITS: Record<Tier, { hour: number; day: number }> = {
  free: { hour: 20, day: 200 },
  pro: { hour: 120, day: 2000 },
  kurumsal: { hour: 600, day: 10000 },
};

export function limitsForTier(tier: string | null | undefined) {
  const key: Tier = tier === "pro" || tier === "kurumsal" ? tier : "free";
  return TIER_LIMITS[key];
}

export type QuotaVerdict =
  | { allowed: true }
  | { allowed: false; scope: "hour" | "day"; limit: number; retryAfterSeconds: number };

export function checkQuota(
  tier: string | null | undefined,
  hourCount: number,
  dayCount: number,
): QuotaVerdict {
  const { hour, day } = limitsForTier(tier);
  if (hourCount >= hour) {
    return { allowed: false, scope: "hour", limit: hour, retryAfterSeconds: 3600 };
  }
  if (dayCount >= day) {
    return { allowed: false, scope: "day", limit: day, retryAfterSeconds: 86400 };
  }
  return { allowed: true };
}
