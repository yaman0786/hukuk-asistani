import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { DISCLAIMER_VERSION } from "@/lib/system-prompt";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("id,title,updated_at,created_at,pinned,archived,tags,folder_id")
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .insert({ user_id: context.userId, title: "Yeni Dosya" })
      .select("id,title,updated_at,created_at,pinned,archived,tags")
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const setThreadFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        pinned: z.boolean().optional(),
        archived: z.boolean().optional(),
        tags: z.array(z.string().min(1).max(40)).max(10).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      pinned?: boolean;
      archived?: boolean;
      tags?: string[];
    } = {};
    if (data.pinned !== undefined) patch.pinned = data.pinned;
    if (data.archived !== undefined) patch.archived = data.archived;
    if (data.tags !== undefined) patch.tags = data.tags;
    const { error } = await context.supabase.from("threads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDisclaimerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("disclaimer_acceptance")
      .select("version,accepted_at")
      .eq("user_id", context.userId)
      .eq("version", DISCLAIMER_VERSION)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      accepted: !!data,
      currentVersion: DISCLAIMER_VERSION,
      acceptedAt: data?.accepted_at ?? null,
    };
  });

export const acceptDisclaimer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("disclaimer_acceptance")
      .insert({ user_id: context.userId, version: DISCLAIMER_VERSION });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true, version: DISCLAIMER_VERSION };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id,role,parts,created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant" | "system",
      parts: r.parts as unknown as Array<{ type: string; text?: string }>,
    }));
  });

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: hourCount }, { count: dayCount }] = await Promise.all([
      context.supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("role", "user")
        .gte("created_at", oneHourAgo),
      context.supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("role", "user")
        .gte("created_at", oneDayAgo),
    ]);
    return {
      hourCount: hourCount ?? 0,
      dayCount: dayCount ?? 0,
      hourLimit: 20,
      dayLimit: 200,
    };
  });

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: threads }, { data: messages }] = await Promise.all([
      context.supabase
        .from("threads")
        .select("id,title,created_at,updated_at")
        .order("created_at", { ascending: true }),
      context.supabase
        .from("messages")
        .select("id,thread_id,role,parts,created_at")
        .order("created_at", { ascending: true }),
    ]);
    return {
      exported_at: new Date().toISOString(),
      user_id: context.userId,
      threads: threads ?? [],
      messages: messages ?? [],
    };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    // Delete user data as the user (RLS enforced).
    await context.supabase.from("messages").delete().eq("user_id", userId);
    await context.supabase.from("threads").delete().eq("user_id", userId);
    // Auth-user + abuse_strikes (service-role only) via admin client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("abuse_strikes").delete().eq("user_id", userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
