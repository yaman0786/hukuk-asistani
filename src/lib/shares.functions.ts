import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function newToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

export const createShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ threadId: z.string().uuid(), days: z.number().int().min(1).max(90).default(30) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const token = newToken();
    const expires_at = new Date(Date.now() + data.days * 86400 * 1000).toISOString();
    const { error } = await context.supabase.from("thread_shares").insert({
      thread_id: data.threadId,
      owner_id: context.userId,
      token,
      expires_at,
    });
    if (error) throw new Error(error.message);
    return { token, expires_at };
  });

export const listShares = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("thread_shares")
      .select("id,token,expires_at,view_count,revoked,created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const revokeShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("thread_shares")
      .update({ revoked: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public read: no auth. Uses service role to bypass RLS after validating token.
export const readSharedThread = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(4) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: share } = await supabaseAdmin
      .from("thread_shares")
      .select("id,thread_id,expires_at,revoked,view_count")
      .eq("token", data.token)
      .maybeSingle();
    if (!share || share.revoked) return { ok: false as const, reason: "not_found" };
    if (share.expires_at && new Date(share.expires_at) < new Date())
      return { ok: false as const, reason: "expired" };

    const [{ data: thread }, { data: messages }] = await Promise.all([
      supabaseAdmin
        .from("threads")
        .select("id,title,created_at,updated_at")
        .eq("id", share.thread_id)
        .maybeSingle(),
      supabaseAdmin
        .from("messages")
        .select("id,role,parts,created_at")
        .eq("thread_id", share.thread_id)
        .order("created_at", { ascending: true }),
    ]);
    if (!thread) return { ok: false as const, reason: "not_found" };

    // Best-effort view counter (ignore errors).
    await supabaseAdmin
      .from("thread_shares")
      .update({ view_count: (share.view_count ?? 0) + 1 })
      .eq("id", share.id);

    return {
      ok: true as const,
      thread,
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        parts: m.parts as unknown as Array<{ type: string; text?: string }>,
      })),
    };
  });
