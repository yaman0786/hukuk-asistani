// Progressive cooldown for users who repeatedly trigger 429/413 on protected endpoints.
// Strikes decay after 24h of no new strikes. Cooldown escalates with strike count.

const STRIKE_DECAY_MS = 24 * 60 * 60 * 1000;

export function cooldownForStrikes(strikes: number): number {
  // returns milliseconds of block; 0 if no block yet
  if (strikes < 3) return 0;
  if (strikes < 5) return 5 * 60 * 1000; // 5 min
  if (strikes < 8) return 30 * 60 * 1000; // 30 min
  if (strikes < 12) return 2 * 60 * 60 * 1000; // 2 h
  return 24 * 60 * 60 * 1000; // 24 h
}

export type BlockCheck =
  | { blocked: false }
  | { blocked: true; retryAfterSeconds: number; until: string };

export async function checkBlocked(userId: string): Promise<BlockCheck> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("abuse_strikes")
    .select("blocked_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.blocked_until) return { blocked: false };
  const until = new Date(data.blocked_until).getTime();
  const nowMs = Date.now();
  if (until <= nowMs) return { blocked: false };
  return {
    blocked: true,
    retryAfterSeconds: Math.ceil((until - nowMs) / 1000),
    until: new Date(until).toISOString(),
  };
}

export async function recordStrike(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabaseAdmin
    .from("abuse_strikes")
    .select("strike_count, last_strike_at")
    .eq("user_id", userId)
    .maybeSingle();

  let nextCount = 1;
  if (existing) {
    const last = new Date(existing.last_strike_at).getTime();
    const decayed = Date.now() - last > STRIKE_DECAY_MS;
    nextCount = decayed ? 1 : (existing.strike_count ?? 0) + 1;
  }

  const cooldownMs = cooldownForStrikes(nextCount);
  const blockedUntil = cooldownMs > 0 ? new Date(Date.now() + cooldownMs).toISOString() : null;

  await supabaseAdmin.from("abuse_strikes").upsert(
    {
      user_id: userId,
      strike_count: nextCount,
      last_strike_at: nowIso,
      blocked_until: blockedUntil,
      updated_at: nowIso,
    },
    { onConflict: "user_id" },
  );
}
