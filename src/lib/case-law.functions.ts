import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type CaseLawItem = {
  id: string;
  /** Kaynak türü: arşiv ilkesi (içtihat derlemesi) veya güncel yayın */
  origin: "arsiv" | "guncel";
  /** Merci / daire, ör. "Yargıtay 9. HD", "AYM" */
  court: string;
  /** Üst kategori: YARGITAY | DANISTAY | AYM | AIHM | ICTIHAT */
  family: string;
  title: string;
  summary: string;
  ref: string | null;
  url: string | null;
  tags: string[];
  /** ISO tarih (yyyy-mm-dd) — arşiv ilkelerinde null olabilir */
  date: string | null;
};

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function familyOf(court: string): string {
  const c = court.toLocaleLowerCase("tr");
  if (c.includes("danıştay") || c.includes("danistay")) return "DANISTAY";
  if (c.includes("anayasa") || c.startsWith("aym")) return "AYM";
  if (c.includes("aihm") || c.includes("insan hakları")) return "AIHM";
  if (c.includes("yargıtay") || c.includes("yargitay")) return "YARGITAY";
  return "ICTIHAT";
}

/**
 * Public: içtihat arşivi (legal_documents kind='ictihat') + güncel karar
 * yayınlarını (daily_updates) tek listede döner. Filtreleme istemcide yapılır.
 */
export const searchCaseLaw = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();

  const [docsRes, updatesRes] = await Promise.all([
    sb
      .from("legal_documents")
      .select("id, code, article_no, title, content, ref, updated_at")
      .eq("kind", "ictihat")
      .order("code", { ascending: true })
      .limit(500),
    sb
      .from("daily_updates")
      .select("id, kind, title, summary, ref, url, source, tags, published_at")
      .in("kind", ["YARGITAY", "DANISTAY", "AYM", "AIHM", "ICTIHAT"])
      .order("published_at", { ascending: false })
      .limit(300),
  ]);

  if (docsRes.error) throw new Error(docsRes.error.message);
  if (updatesRes.error) throw new Error(updatesRes.error.message);

  const archive: CaseLawItem[] = (docsRes.data ?? []).map((d) => ({
    id: `doc:${d.id}`,
    origin: "arsiv" as const,
    court: d.code,
    family: familyOf(d.code),
    title: d.title,
    summary: d.content,
    ref: d.ref ?? null,
    url: null,
    tags: d.article_no ? [String(d.article_no).split("-")[0]] : [],
    date: null,
  }));

  const live: CaseLawItem[] = (updatesRes.data ?? []).map((u) => ({
    id: `upd:${u.id}`,
    origin: "guncel" as const,
    court: u.source || u.kind,
    family: u.kind,
    title: u.title,
    summary: u.summary,
    ref: u.ref ?? null,
    url: u.url ?? null,
    tags: (u.tags ?? []) as string[],
    date: u.published_at as string,
  }));

  return [...live, ...archive];
});
