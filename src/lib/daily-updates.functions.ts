import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DailyUpdate = {
  id: string;
  kind: "AYM" | "YARGITAY" | "DANISTAY" | "AIHM" | "KANUN" | "RG" | "ICTIHAT";
  title: string;
  summary: string;
  ref: string | null;
  url: string | null;
  source: string | null;
  tags: string[];
  published_at: string;
  importance: number;
};

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public: latest legal updates for landing / ticker. */
const UPDATE_KINDS = ["AYM", "YARGITAY", "DANISTAY", "AIHM", "KANUN", "RG", "ICTIHAT"] as const;

export const listDailyUpdates = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        limit: z.number().min(1).max(100).default(12),
        offset: z.number().min(0).max(1000).default(0),
        kinds: z.array(z.enum(UPDATE_KINDS)).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb
      .from("daily_updates")
      .select("id, kind, title, summary, ref, url, source, tags, published_at, importance")
      .order("published_at", { ascending: false })
      .order("importance", { ascending: false });
    if (data.kinds && data.kinds.length > 0) {
      query = query.in("kind", data.kinds);
    }
    query = query.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as DailyUpdate[];
  });

/** Authenticated: updates matched to the user's active case topics (from their thread titles). */
export const listPersonalizedUpdates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: threads } = await context.supabase
      .from("threads")
      .select("title")
      .order("updated_at", { ascending: false })
      .limit(20);

    const titles = (threads ?? []).map((t: { title: string }) =>
      (t.title ?? "").toLocaleLowerCase("tr"),
    );
    const blob = titles.join(" | ");

    // Keyword -> tags mapping; expand freely.
    const map: Array<{ kw: RegExp; tags: string[] }> = [
      { kw: /tahliye|kira|ecrimisil/i, tags: ["kira", "tahliye"] },
      {
        kw: /icra|takip|itirazın iptali|itirazin iptali|haciz/i,
        tags: ["icra", "itirazin iptali"],
      },
      {
        kw: /boşanma|bosanma|velayet|nafaka|aile/i,
        tags: ["bosanma", "velayet", "nafaka", "aile"],
      },
      {
        kw: /iş|is\b|işten çıkar|isten cikar|kıdem|kidem|ihbar|işe iade|ise iade/i,
        tags: ["is hukuku", "ihbar", "ise iade", "tazminat"],
      },
      { kw: /tüketici|tuketici|cayma|mesafeli/i, tags: ["tuketici", "cayma", "mesafeli"] },
      { kw: /vergi|tarhiyat/i, tags: ["vergi", "zamanasimi"] },
      { kw: /ceza|beraat|tutuk/i, tags: ["ceza", "adil yargılanma"] },
      { kw: /miras|izale/i, tags: ["miras"] },
      { kw: /aihm|ifade özgür|ifade ozgur/i, tags: ["aihm", "ifade ozgurlugu"] },
    ];

    const interestTags = new Set<string>();
    for (const { kw, tags } of map) {
      if (kw.test(blob)) tags.forEach((t) => interestTags.add(t));
    }

    let query = context.supabase
      .from("daily_updates")
      .select("id, kind, title, summary, ref, url, source, tags, published_at, importance")
      .order("published_at", { ascending: false })
      .order("importance", { ascending: false })
      .limit(6);

    if (interestTags.size > 0) {
      query = query.overlaps("tags", Array.from(interestTags));
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    return {
      interests: Array.from(interestTags),
      items: (rows ?? []) as DailyUpdate[],
    };
  });

/**
 * Public: fetch the raw/original page for a legal update and return a
 * cleaned, plain-text version so the client can render it inline
 * without CORS issues. Whitelist trusted Turkish legal sources only.
 */
const ALLOWED_HOSTS = new Set([
  "resmigazete.gov.tr",
  "www.resmigazete.gov.tr",
  "anayasa.gov.tr",
  "www.anayasa.gov.tr",
  "kararlarbilgibankasi.anayasa.gov.tr",
  "mevzuat.gov.tr",
  "www.mevzuat.gov.tr",
  "kararlar.yargitay.gov.tr",
  "karararama.yargitay.gov.tr",
  "emsal.uyap.gov.tr",
  "karararama.danistay.gov.tr",
  "danistay.gov.tr",
  "www.danistay.gov.tr",
  "hudoc.echr.coe.int",
]);

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(html: string): { title: string | null; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim().replace(/\s+/g, " ") : null;

  let body = html;
  const mainMatch =
    html.match(/<main[\s\S]*?<\/main>/i) ??
    html.match(/<article[\s\S]*?<\/article>/i) ??
    html.match(/<div[^>]*id=["']?(?:content|main|icerik|govde)[^>]*>[\s\S]*?<\/div>/i);
  if (mainMatch) body = mainMatch[0];

  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  return {
    title,
    text: decodeEntities(text)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .map((l) => l.trim())
      .join("\n")
      .trim(),
  };
}

export const fetchUpdateSource = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    let host = "";
    try {
      host = new URL(data.url).hostname.toLowerCase();
    } catch {
      return { ok: false as const, error: "Geçersiz bağlantı." };
    }
    if (!ALLOWED_HOSTS.has(host)) {
      return {
        ok: false as const,
        error: `Bu kaynak uygulama içinde açılamıyor (${host}). "Yeni sekmede aç" butonunu kullanın.`,
      };
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(data.url, {
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; HukukMasterAI/1.0; +https://hukukmaster.ai)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "tr-TR,tr;q=0.9,en;q=0.6",
        },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) {
        return { ok: false as const, error: `Kaynak yanıtı: ${res.status}` };
      }
      const ct = res.headers.get("content-type") ?? "";
      if (!/text\/html|application\/xhtml/i.test(ct)) {
        return {
          ok: false as const,
          error: `Metin olarak gösterilemiyor (${ct || "bilinmeyen tür"}).`,
        };
      }
      const raw = await res.text();
      const capped = raw.length > 1_500_000 ? raw.slice(0, 1_500_000) : raw;
      const { title, text } = stripHtml(capped);
      const trimmed = text.length > 60_000 ? text.slice(0, 60_000) + "\n\n…" : text;
      return {
        ok: true as const,
        host,
        title,
        text: trimmed,
        fetched_at: new Date().toISOString(),
      };
    } catch (err) {
      return {
        ok: false as const,
        error:
          err instanceof Error && err.name === "AbortError"
            ? "Kaynak zaman aşımına uğradı."
            : "Kaynak alınamadı.",
      };
    }
  });
