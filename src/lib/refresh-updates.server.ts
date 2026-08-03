/**
 * Scraper core — pulls daily updates from Resmî Gazete and AYM and
 * writes them into public.daily_updates via the service-role client.
 *
 * Kept as a plain server-only helper so both the public webhook route
 * (pg_cron / external caller) AND the admin server function can invoke
 * it directly, with no self-fetch and no public URL round-trip.
 */

import { createClient } from "@supabase/supabase-js";

type Kind = "AYM" | "YARGITAY" | "DANISTAY" | "AIHM" | "KANUN" | "RG" | "ICTIHAT";

type Item = {
  kind: Kind;
  title: string;
  summary: string;
  ref: string | null;
  url: string | null;
  tags: string[];
  published_at: string;
  importance: number;
  source: string;
};

export type RefreshResult = {
  ok: true;
  inserted: number;
  attempted: number;
  sources: Record<string, number>;
  errors: Record<string, string>;
  fallback?: boolean;
  upsertError?: string;
  note?: string;
};

const UA = "Mozilla/5.0 (compatible; HukukMasterAI/1.0; +https://hukukmaster.ai)";

function todayIsoTr(): string {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function tagsFromTitle(title: string): string[] {
  const t = title.toLocaleLowerCase("tr");
  const tags = new Set<string>();
  const map: Array<[RegExp, string[]]> = [
    [/kira|tahliye|ecrimisil/, ["kira", "tahliye"]],
    [/icra|iflas|haciz/, ["icra"]],
    [/boşan|nafaka|velayet|aile/, ["aile", "boşanma"]],
    [/iş(çi)?|kıdem|ihbar|mobbing|sendika/, ["iş hukuku"]],
    [/tüketici|ayıp|garanti/, ["tüketici"]],
    [/vergi|katma değer|kdv|gelir/, ["vergi"]],
    [/ceza|tck|hükümlü|tutuklu|infaz/, ["ceza"]],
    [/miras|tereke|vasiyet/, ["miras"]],
    [/kişisel veri|kvkk/, ["kvkk"]],
    [/imar|kentsel dönüşüm|kamulaştır/, ["idare", "imar"]],
    [/anayasa|bireysel başvuru/, ["anayasa"]],
  ];
  for (const [re, ts] of map) if (re.test(t)) ts.forEach((x) => tags.add(x));
  return [...tags];
}

async function fetchResmiGazete(): Promise<Item[]> {
  const today = todayIsoTr();
  const [y, m, d] = today.split("-");
  const url = `https://www.resmigazete.gov.tr/eskiler/${y}/${m}/${y}${m}${d}.htm`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const buf = await res.arrayBuffer();
  const html = new TextDecoder("windows-1254").decode(buf);

  const items: Item[] = [];
  const linkRe = /<a[^>]+href="([^"]+\.htm)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1];
    const rawTitle = stripHtml(match[2]);
    if (!rawTitle || rawTitle.length < 20 || rawTitle.length > 400) continue;
    if (!/^\d{8}-/.test(href)) continue;
    if (seen.has(rawTitle)) continue;
    seen.add(rawTitle);

    let kind: Kind = "RG";
    const upper = rawTitle.toLocaleUpperCase("tr");
    if (/\bKANUN\b/.test(upper)) kind = "KANUN";
    else if (/YARGITAY/.test(upper)) kind = "YARGITAY";
    else if (/DANIŞTAY|DANISTAY/.test(upper)) kind = "DANISTAY";
    else if (/ANAYASA MAHKEMESİ|ANAYASA MAHKEMESI/.test(upper)) kind = "AYM";

    items.push({
      kind,
      title: rawTitle.slice(0, 240),
      summary: `Resmî Gazete — ${today} tarihli sayıda yayımlandı.`,
      ref: `RG ${today}`,
      url: `https://www.resmigazete.gov.tr/eskiler/${y}/${m}/${href}`,
      tags: tagsFromTitle(rawTitle),
      published_at: today,
      importance: kind === "KANUN" ? 5 : 3,
      source: "resmigazete.gov.tr",
    });
    if (items.length >= 25) break;
  }
  return items;
}

async function fetchAym(): Promise<Item[]> {
  const url = "https://www.anayasa.gov.tr/tr/haberler/basin-duyurular/";
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const items: Item[] = [];

  const cardRe =
    /<a[^>]+href="(\/tr\/haberler\/[^"]+)"[^>]*>[\s\S]{0,600}?<h\d[^>]*>([\s\S]*?)<\/h\d>/gi;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html)) !== null) {
    const href = m[1];
    const title = stripHtml(m[2]);
    if (!title || title.length < 15 || seen.has(title)) continue;
    seen.add(title);
    items.push({
      kind: "AYM",
      title: title.slice(0, 240),
      summary:
        "Anayasa Mahkemesi Basın Duyurusu — bireysel başvuru veya norm denetimi kararı özeti.",
      ref: "AYM Basın Duyurusu",
      url: `https://www.anayasa.gov.tr${href}`,
      tags: [...new Set(["anayasa", ...tagsFromTitle(title)])],
      published_at: todayIsoTr(),
      importance: 4,
      source: "anayasa.gov.tr",
    });
    if (items.length >= 10) break;
  }
  return items;
}

/** Runs the scraper end-to-end. Safe to call from any server context. */
export async function runRefreshUpdates(): Promise<RefreshResult> {
  const collected: Item[] = [];
  const errors: Record<string, string> = {};

  const runners: Array<[string, () => Promise<Item[]>]> = [
    ["resmigazete", fetchResmiGazete],
    ["aym", fetchAym],
  ];
  const results = await Promise.allSettled(runners.map(([, fn]) => fn()));
  results.forEach((r, i) => {
    const name = runners[i][0];
    if (r.status === "fulfilled") {
      collected.push(...r.value);
    } else {
      const err = r.reason as { message?: string } | undefined;
      errors[name] = String(err?.message ?? r.reason ?? "error");
    }
  });

  if (collected.length === 0) {
    return {
      ok: true,
      inserted: 0,
      attempted: 0,
      sources: {},
      errors,
      note: "no items parsed",
    };
  }

  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb
    .from("daily_updates")
    .upsert(collected, {
      onConflict: "kind,published_at,title",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    let inserted = 0;
    for (const it of collected) {
      const { error: e } = await sb.from("daily_updates").insert(it);
      if (!e) inserted++;
    }
    return {
      ok: true,
      inserted,
      attempted: collected.length,
      sources: {},
      errors,
      fallback: true,
      upsertError: error.message,
    };
  }

  const bySource = collected.reduce<Record<string, number>>((acc, it) => {
    acc[it.source] = (acc[it.source] ?? 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    inserted: data?.length ?? 0,
    attempted: collected.length,
    sources: bySource,
    errors,
  };
}
