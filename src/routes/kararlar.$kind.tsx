import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Landmark,
  Gavel,
  Scale,
  BookOpen,
  Newspaper,
  ScrollText,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import { listDailyUpdates, type DailyUpdate } from "@/lib/daily-updates.functions";
import { createThread, listThreads } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type CategoryKey = "yargitay" | "aym" | "emsal";

const CATEGORY: Record<
  CategoryKey,
  {
    title: string;
    subtitle: string;
    kinds: Array<DailyUpdate["kind"]>;
    accent: string;
  }
> = {
  yargitay: {
    title: "Yargıtay Kararları",
    subtitle: "Yargıtay Hukuk ve Ceza Genel Kurulu ile daire kararlarının en güncel yayımları.",
    kinds: ["YARGITAY"],
    accent: "from-primary/20 to-primary/5",
  },
  aym: {
    title: "Anayasa Mahkemesi Kararları",
    subtitle:
      "Bireysel başvuru ve norm denetimi kararları; ihlal tespitleri ve içtihat gelişmeleri.",
    kinds: ["AYM"],
    accent: "from-amber-500/20 to-amber-500/5",
  },
  emsal: {
    title: "Emsal Kararlar ve İçtihat",
    subtitle: "Yargıtay, Danıştay, AİHM ve öne çıkan içtihat kararlarını bir arada takip edin.",
    kinds: ["YARGITAY", "DANISTAY", "AIHM", "ICTIHAT"],
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
};

const KIND_LABEL: Record<string, string> = {
  AYM: "AYM",
  YARGITAY: "YARGITAY",
  DANISTAY: "DANIŞTAY",
  AIHM: "AİHM",
  KANUN: "YENİ KANUN",
  RG: "RESMİ GAZETE",
  ICTIHAT: "İÇTİHAT",
};

const KIND_ICON: Record<string, typeof Gavel> = {
  AYM: Landmark,
  YARGITAY: Gavel,
  DANISTAY: Landmark,
  AIHM: Scale,
  KANUN: ScrollText,
  RG: Newspaper,
  ICTIHAT: BookOpen,
};

function relativeTr(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export const Route = createFileRoute("/kararlar/$kind")({
  validateSearch: (search: Record<string, unknown>) =>
    z.object({ highlight: z.string().uuid().optional() }).parse(search),
  beforeLoad: ({ params }) => {
    if (!(params.kind in CATEGORY)) throw notFound();
  },
  head: ({ params }) => {
    const key = params.kind as CategoryKey;
    const cfg = CATEGORY[key] ?? CATEGORY.emsal;
    const title = `${cfg.title} — Türkiye Hukuk Master AI`;
    const desc = cfg.subtitle;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: KararlarPage,
  notFoundComponent: () => (
    <div className="max-w-2xl mx-auto p-10 text-center">
      <h1 className="font-serif text-2xl mb-2">Kategori bulunamadı</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Yalnızca <code>/kararlar/yargitay</code>, <code>/kararlar/aym</code> ve{" "}
        <code>/kararlar/emsal</code> kategorileri mevcut.
      </p>
      <Link to="/" className="text-primary hover:underline">
        Ana sayfa
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="max-w-2xl mx-auto p-10 text-center">
      <h1 className="font-serif text-2xl mb-2">Bir hata oluştu</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function buildAskPrompt(it: DailyUpdate): string {
  const parts = [
    `Aşağıdaki kararın ne olduğunu tarafsız, sade bir dille açıkla. Kararın konusu, dayandığı hukuki mesele ve mahkemenin vardığı sonuç nedir? Sadece kararın içeriğini özetle; "acil risk", "hemen şunu yapın", tavsiye, uyarı veya kişisel yorum ekleme. Abartma, önyargı ve genel hukuki uyarı cümleleri kullanma.`,
    ``,
    `Başlık: ${it.title}`,
    `Tür: ${KIND_LABEL[it.kind] ?? it.kind}`,
  ];
  if (it.ref) parts.push(`Numara: ${it.ref}`);
  if (it.source) parts.push(`Kaynak: ${it.source}`);
  if (it.url) parts.push(`Bağlantı: ${it.url}`);
  parts.push(``, `Mevcut özet:`, it.summary);
  return parts.join("\n");
}

function resolveSourceUrl(it: DailyUpdate): string {
  if (it.url) return it.url;
  if (it.kind === "YARGITAY") return "https://karararama.yargitay.gov.tr/";
  if (it.kind === "AYM") return "https://kararlarbilgibankasi.anayasa.gov.tr/";
  if (it.kind === "DANISTAY") return "https://karararama.danistay.gov.tr/";
  if (it.kind === "AIHM") return "https://hudoc.echr.coe.int/tur";
  if (it.kind === "ICTIHAT") return "https://emsal.uyap.gov.tr/";
  if (it.kind === "RG") return "https://www.resmigazete.gov.tr/";
  if (it.kind === "KANUN") return "https://www.mevzuat.gov.tr/";
  return "https://www.turkiye.gov.tr/";
}

function KararlarPage() {
  const { kind } = Route.useParams();
  const { highlight } = Route.useSearch();
  const navigate = useNavigate();
  const cfg = CATEGORY[kind as CategoryKey];
  const fetchUpdates = useServerFn(listDailyUpdates);
  const createFn = useServerFn(createThread);
  const listThreadsFn = useServerFn(listThreads);
  const [filter, setFilter] = useState<DailyUpdate["kind"] | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [flashId, setFlashId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["kararlar", kind],
    queryFn: () => fetchUpdates({ data: { kinds: cfg.kinds, limit: 100, offset: 0 } }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const items = (q.data ?? []) as DailyUpdate[];
  const filtered = useMemo(() => {
    const byKind = filter === "ALL" ? items : items.filter((i) => i.kind === filter);
    const query = search.trim().toLocaleLowerCase("tr");
    if (!query) return byKind;
    return byKind.filter((i) => {
      const hay = [i.title, i.summary, i.ref ?? "", i.source ?? "", (i.tags ?? []).join(" ")]
        .join(" ")
        .toLocaleLowerCase("tr");
      return hay.includes(query);
    });
  }, [items, filter, search]);

  // Scroll to and briefly emphasize a highlighted item once data is available.
  useEffect(() => {
    if (!highlight || items.length === 0) return;
    const exists = items.some((i) => i.id === highlight);
    if (!exists) return;
    // Reset filters/search so the target is visible.
    if (filter !== "ALL") setFilter("ALL");
    if (search) setSearch("");
    const el = itemRefs.current[highlight];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(highlight);
      const t = window.setTimeout(() => setFlashId(null), 2600);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, items.length]);

  async function askAssistant(it: DailyUpdate) {
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        try {
          sessionStorage.setItem("autosend:pending", buildAskPrompt(it));
        } catch {
          /* ignore */
        }
        toast.info("Devam etmek için giriş yapın.");
        navigate({ to: "/auth" });
        return;
      }
      // Yeni dosya açmak yerine mevcut son dosyayı kullan.
      const existing = await listThreadsFn();
      const latest = (existing ?? []).find((t) => !t.archived) ?? existing?.[0];
      const target = latest ?? (await createFn());
      try {
        sessionStorage.setItem(`autosend:${target.id}`, buildAskPrompt(it));
      } catch {
        /* ignore */
      }
      navigate({ to: "/chat/$threadId", params: { threadId: target.id } });
    } catch (e) {
      toast.error((e as Error).message || "İşlem başarısız.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className={`relative overflow-hidden border-b border-border bg-gradient-to-br ${cfg.accent}`}
      >
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="w-4 h-4" /> Ana sayfa
            </button>
            <Link
              to="/ictihat"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Search className="w-4 h-4" /> Gelişmiş içtihat arama
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mb-2">
            <Gavel className="w-3.5 h-3.5" /> Canlı Hukuk Gündemi
          </div>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight">{cfg.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl">
            {cfg.subtitle}
          </p>

          <div className="mt-6 flex items-center gap-2 flex-wrap">
            {cfg.kinds.length > 1 && (
              <>
                <button
                  onClick={() => setFilter("ALL")}
                  className={`text-xs rounded-full px-3 py-1 border transition ${
                    filter === "ALL"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tümü
                </button>
                {cfg.kinds.map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`text-xs rounded-full px-3 py-1 border transition ${
                      filter === k
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {KIND_LABEL[k] ?? k}
                  </button>
                ))}
              </>
            )}
            <button
              onClick={() => q.refetch()}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-full border border-border bg-background px-3 py-1 transition"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${q.isFetching ? "animate-spin" : ""}`} />
              {q.isFetching ? "Güncelleniyor" : "Yenile"}
            </button>
          </div>

          {/* Sayfa içi arama */}
          <div className="mt-4 relative max-w-xl">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Karar ara: başlık, özet, numara veya etiket…"
              className="w-full rounded-full border border-border bg-background pl-9 pr-9 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Temizle
              </button>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {filtered.length} karar gösteriliyor{search ? ` · "${search}" için` : ""}
          </div>
        </div>
      </div>

      {/* List */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {q.isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {search
              ? `"${search}" için sonuç bulunamadı. Farklı bir kelime deneyin veya filtreyi genişletin.`
              : "Bu kategoride henüz kayıt bulunmuyor. Sistem 4 saatte bir Resmî Gazete ve AYM kaynaklarından güncellenir."}
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it) => {
              const Icon = KIND_ICON[it.kind] ?? Gavel;
              const src = resolveSourceUrl(it);
              return (
                <li
                  key={it.id}
                  ref={(el) => {
                    itemRefs.current[it.id] = el;
                  }}
                  className={
                    "scroll-mt-24 transition " +
                    (flashId === it.id ? "ring-2 ring-primary/80 rounded-xl shadow-lg" : "")
                  }
                >
                  <article className="group h-full flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 font-semibold">
                        <Icon className="w-3 h-3" /> {KIND_LABEL[it.kind] ?? it.kind}
                      </span>
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {relativeTr(it.published_at)}
                      </span>
                    </div>
                    <h2 className="font-serif text-lg leading-snug mb-2">{it.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                      {it.summary}
                    </p>
                    {it.ref && (
                      <p className="text-[11px] text-muted-foreground/80 mt-3 font-mono break-words">
                        {it.ref}
                      </p>
                    )}
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => askAssistant(it)}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Scale className="w-3 h-3" /> Asistana sor →
                      </button>
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                        title={it.source ?? "Resmî kaynağı aç"}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {it.source ?? "Resmî kaynak"}
                      </a>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[11px] text-muted-foreground mt-8 text-center">
          Kaynaklar her 4 saatte bir Resmî Gazete ve Anayasa Mahkemesi'nden otomatik olarak
          toplanır. Kararların uygulanmasında güncel metnin doğrulanması tavsiye edilir.
        </p>
      </section>
    </div>
  );
}
