import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Canlı duruşma odası kayıtları: birden çok katılımcı aynı tutanağı anlık görür. */

export type LiveTurn = {
  id: string;
  hearing_id: string;
  author_id: string | null;
  role: string;
  speaker: string;
  action: string | null;
  text: string;
  created_at: string;
};

export type LiveParticipant = {
  user_id: string;
  role: string;
  display_name: string;
  joined_at: string;
};

export type HearingSummary = {
  id: string;
  code: string;
  title: string;
  court: string;
  caseType: string;
  status: string;
  hasVerdict: boolean;
  isOwner: boolean;
  myRole: string;
  updatedAt: string;
};

const turnInput = z.object({
  role: z.string().max(40),
  speaker: z.string().max(80),
  action: z.string().max(40).nullable().optional(),
  text: z.string().min(1).max(6000),
  mine: z.boolean().optional(),
});

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Yeni canlı duruşma odası açar ve ilk celse konuşmalarını kaydeder. */
export const createHearingRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().max(200).default("Duruşma"),
        court: z.string().max(200).default(""),
        caseType: z.string().max(40),
        role: z.string().max(40),
        displayName: z.string().max(80).default(""),
        setup: z.record(z.string(), z.unknown()).default({}),
        turns: z.array(turnInput).max(60).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;

    let code = makeCode();
    let hearing: { id: string; code: string } | null = null;
    for (let attempt = 0; attempt < 5 && !hearing; attempt++) {
      const { data: row, error } = await db
        .from("hearings")
        .insert({
          owner_id: context.userId,
          code,
          title: data.title || "Duruşma",
          court: data.court,
          case_type: data.caseType,
          setup: data.setup,
        })
        .select("id, code")
        .single();
      if (!error && row) hearing = row;
      else if (error?.code === "23505") code = makeCode();
      else if (error) throw new Error(error.message);
    }
    if (!hearing) throw new Error("Duruşma odası açılamadı, tekrar deneyin.");

    await db.from("hearing_participants").insert({
      hearing_id: hearing.id,
      user_id: context.userId,
      role: data.role,
      display_name: data.displayName,
    });

    if (data.turns.length) {
      const { error } = await db.from("hearing_turns").insert(
        data.turns.map((t) => ({
          hearing_id: hearing!.id,
          author_id: t.mine ? context.userId : null,
          role: t.role,
          speaker: t.speaker,
          action: t.action ?? null,
          text: t.text,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return { hearingId: hearing.id, code: hearing.code };
  });

/** Katılım koduyla mevcut duruşmaya girer. */
export const joinHearingRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z
          .string()
          .trim()
          .min(4)
          .max(12)
          .transform((v) => v.toUpperCase()),
        role: z.string().max(40),
        displayName: z.string().max(80).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: found } = await (supabaseAdmin as any)
      .from("hearings")
      .select("id, status")
      .eq("code", data.code)
      .maybeSingle();
    if (!found) throw new Error("Bu koda ait bir duruşma bulunamadı.");

    const db = context.supabase as any;
    const { error } = await db.from("hearing_participants").upsert(
      {
        hearing_id: found.id,
        user_id: context.userId,
        role: data.role,
        display_name: data.displayName,
      },
      { onConflict: "hearing_id,user_id" },
    );
    if (error) throw new Error(error.message);

    return { hearingId: found.id as string };
  });

/** Duruşmanın güncel durumunu (kurulum, katılımcılar, tutanak) döner. */
export const getHearingRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ hearingId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const { data: hearing, error } = await db
      .from("hearings")
      .select("id, code, title, court, case_type, setup, verdict, status, owner_id")
      .eq("id", data.hearingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!hearing) throw new Error("Duruşmaya erişiminiz yok.");

    const [{ data: turns }, { data: participants }] = await Promise.all([
      db
        .from("hearing_turns")
        .select("id, hearing_id, author_id, role, speaker, action, text, created_at")
        .eq("hearing_id", data.hearingId)
        .order("created_at", { ascending: true }),
      db
        .from("hearing_participants")
        .select("user_id, role, display_name, joined_at")
        .eq("hearing_id", data.hearingId)
        .order("joined_at", { ascending: true }),
    ]);

    return {
      hearing,
      turns: (turns ?? []) as LiveTurn[],
      participants: (participants ?? []) as LiveParticipant[],
    };
  });

/** Yeni beyan/itiraz/delil kayıtlarını tutanağa ekler; diğer katılımcılara anlık düşer. */
export const appendHearingTurns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        hearingId: z.string().uuid(),
        turns: z.array(turnInput).min(1).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const { data: rows, error } = await db
      .from("hearing_turns")
      .insert(
        data.turns.map((t) => ({
          hearing_id: data.hearingId,
          author_id: t.mine ? context.userId : null,
          role: t.role,
          speaker: t.speaker,
          action: t.action ?? null,
          text: t.text,
        })),
      )
      .select("id, hearing_id, author_id, role, speaker, action, text, created_at");
    if (error) throw new Error(error.message);
    return { turns: (rows ?? []) as LiveTurn[] };
  });

/** Kullanıcının katıldığı/açtığı duruşmaları listeler (kaldığı yerden devam için). */
export const listMyHearings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const { data: mine } = await db
      .from("hearing_participants")
      .select("hearing_id, role, joined_at")
      .eq("user_id", context.userId)
      .order("joined_at", { ascending: false })
      .limit(20);

    const ids = (mine ?? []).map((m: { hearing_id: string }) => m.hearing_id);
    if (!ids.length) return { hearings: [] as HearingSummary[] };

    const { data: rows } = await db
      .from("hearings")
      .select("id, code, title, court, case_type, status, verdict, owner_id, updated_at")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    const roleById = new Map<string, string>(
      (mine ?? []).map((m: { hearing_id: string; role: string }) => [m.hearing_id, m.role]),
    );

    return {
      hearings: ((rows ?? []) as any[]).map((h) => ({
        id: h.id as string,
        code: h.code as string,
        title: h.title as string,
        court: (h.court ?? "") as string,
        caseType: (h.case_type ?? "") as string,
        status: (h.status ?? "open") as string,
        hasVerdict: Boolean(h.verdict),
        isOwner: h.owner_id === context.userId,
        myRole: roleById.get(h.id) ?? "",
        updatedAt: h.updated_at as string,
      })) satisfies HearingSummary[],
    };
  });

/** Kararı kaydeder ve duruşmayı kapatır (yalnızca duruşmayı açan hâkim/sahip). */
export const saveHearingVerdict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ hearingId: z.string().uuid(), verdict: z.string().min(1).max(20000) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const { error } = await db
      .from("hearings")
      .update({ verdict: data.verdict, status: "closed", updated_at: new Date().toISOString() })
      .eq("id", data.hearingId)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Duruşmadan ayrılır (katılımcı kaydı silinir). */
export const leaveHearingRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ hearingId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    await db
      .from("hearing_participants")
      .delete()
      .eq("hearing_id", data.hearingId)
      .eq("user_id", context.userId);
    return { ok: true };
  });

