import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  },
  userId: string,
) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { count: userCount },
      { count: threadCount },
      { count: messageCount },
      { data: recentUsers },
      { data: negFeedback },
      { data: strikes },
    ] = await Promise.all([
      supabaseAdmin.from("threads").select("user_id", { count: "exact", head: true }),
      supabaseAdmin.from("threads").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("threads")
        .select("user_id,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("message_feedback")
        .select("message_id,user_id,reason,created_at,rating")
        .eq("rating", -1)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("abuse_strikes")
        .select("user_id,strike_count,blocked_until,last_strike_at")
        .order("last_strike_at", { ascending: false })
        .limit(50),
    ]);

    return {
      counts: {
        threads: threadCount ?? 0,
        messages: messageCount ?? 0,
        activeUsers: userCount ?? 0,
      },
      recentUsers: recentUsers ?? [],
      negativeFeedback: negFeedback ?? [],
      strikes: strikes ?? [],
    };
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: !!data };
  });

export const resetUserStrikes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const o = d as { userId?: string };
    if (!o?.userId || typeof o.userId !== "string") throw new Error("userId required");
    return { userId: o.userId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("abuse_strikes").delete().eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: run the scraper directly in-process — no self-fetch, no URL. */
export const adminRefreshUpdates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { runRefreshUpdates } = await import("@/lib/refresh-updates.server");
    const result = await runRefreshUpdates();
    return {
      inserted: result.inserted,
      attempted: result.attempted,
      sources: result.sources,
      errors: result.errors,
    };
  });

/** Admin: recent daily_updates activity — last run, counts, sources. */
export const adminUpdatesStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since1 = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [lastRes, rows24Res, count1Res, countTotalRes] = await Promise.all([
      supabaseAdmin
        .from("daily_updates")
        .select("created_at,source,kind,title")
        .order("created_at", { ascending: false })
        .limit(1),
      supabaseAdmin
        .from("daily_updates")
        .select("source,kind,created_at")
        .gte("created_at", since24),
      supabaseAdmin
        .from("daily_updates")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since1),
      supabaseAdmin.from("daily_updates").select("id", { count: "exact", head: true }),
    ]);
    const last = lastRes.data;
    const rows24 = rows24Res.data;
    const last1hCount = count1Res.count ?? 0;
    const total = countTotalRes.count ?? 0;

    const sources24: Record<string, number> = {};
    const kinds24: Record<string, number> = {};
    let lastBatchAt: string | null = null;
    let lastBatchCount = 0;
    for (const r of rows24 ?? []) {
      const s = (r as { source: string | null }).source ?? "bilinmiyor";
      const k = (r as { kind: string }).kind;
      sources24[s] = (sources24[s] ?? 0) + 1;
      kinds24[k] = (kinds24[k] ?? 0) + 1;
    }
    // "Last batch" = rows inserted within 2 min of the newest created_at.
    const newest = last?.[0]?.created_at as string | undefined;
    if (newest && rows24) {
      const newestMs = new Date(newest).getTime();
      lastBatchAt = newest;
      lastBatchCount = rows24.filter(
        (r) =>
          newestMs - new Date((r as { created_at: string }).created_at).getTime() < 2 * 60 * 1000,
      ).length;
    }

    return {
      lastRunAt: newest ?? null,
      lastBatchAt,
      lastBatchCount,
      last24hCount: (rows24 ?? []).length,
      last1hCount,
      totalCount: total,
      sources24,
      kinds24,
    };
  });
