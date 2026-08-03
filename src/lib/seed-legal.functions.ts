// Admin-triggered seeding of the curated legal corpus into legal_documents.
// Idempotent: skips (code, article_no) pairs already present.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL_CORPUS } from "@/data/legal-corpus";
import { CASE_LAW_CORPUS } from "@/data/case-law-corpus";

const FULL_CORPUS = [...LEGAL_CORPUS, ...CASE_LAW_CORPUS];

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

async function embed(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-embedding-001",
      input: text.slice(0, 6000),
    }),
  });
  if (!res.ok) throw new Error(`embed ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  const vec = json.data?.[0]?.embedding;
  if (!vec) throw new Error("no embedding returned");
  return vec;
}

async function assertAdmin(
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  },
  userId: string,
) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const seedLegalStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("legal_documents")
      .select("id", { count: "exact", head: true });
    const { count: caseCount } = await supabaseAdmin
      .from("legal_documents")
      .select("id", { count: "exact", head: true })
      .eq("kind", "ictihat");
    return {
      seeded: count ?? 0,
      total: FULL_CORPUS.length,
      caseLaw: caseCount ?? 0,
      caseLawTotal: CASE_LAW_CORPUS.length,
    };
  });

export const seedLegalCorpus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find already-present (code, article_no) pairs to skip.
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("legal_documents")
      .select("code,article_no");
    if (exErr) throw new Error(exErr.message);
    const have = new Set((existing ?? []).map((r) => `${r.code}|${r.article_no ?? ""}`));

    const todo = FULL_CORPUS.filter((e) => !have.has(`${e.code}|${e.article_no}`));

    let inserted = 0;
    const failures: string[] = [];

    // Serial to stay under provider rate limits; corpus is small.
    for (const entry of todo) {
      try {
        const text = `${entry.code} ${entry.article_no} — ${entry.title}\n${entry.content}`;
        const vector = await embed(text);
        const { error } = await supabaseAdmin.from("legal_documents").insert({
          kind: entry.kind,
          code: entry.code,
          article_no: entry.article_no,
          title: entry.title,
          content: entry.content,
          ref: entry.ref,
          embedding: vector as unknown as string,
        });
        if (error) throw new Error(error.message);
        inserted += 1;
      } catch (e) {
        failures.push(`${entry.code} ${entry.article_no}: ${(e as Error).message}`);
      }
    }

    // Backfill: rows inserted earlier without an embedding are invisible to RAG.
    let backfilled = 0;
    const { data: missing } = await supabaseAdmin
      .from("legal_documents")
      .select("id, code, article_no, title, content")
      .is("embedding", null)
      .limit(200);
    for (const row of missing ?? []) {
      try {
        const vector = await embed(
          `${row.code} ${row.article_no ?? ""} — ${row.title}\n${row.content}`,
        );
        const { error } = await supabaseAdmin
          .from("legal_documents")
          .update({ embedding: vector as unknown as string })
          .eq("id", row.id);
        if (error) throw new Error(error.message);
        backfilled += 1;
      } catch (e) {
        failures.push(`backfill ${row.code} ${row.article_no ?? ""}: ${(e as Error).message}`);
      }
    }

    return {
      inserted,
      backfilled,
      skipped: FULL_CORPUS.length - todo.length,
      failed: failures.length,
      failures: failures.slice(0, 10),
    };
  });
