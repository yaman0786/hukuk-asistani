import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
  Gavel,
  Landmark,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { searchCaseLaw, type CaseLawItem } from "@/lib/case-law.functions";
import { createThread, listThreads } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FAMILY_LABEL: Record<string, string> = {
  YARGITAY: "Yargıtay",
  DANISTAY: "Danıştay",
  AYM: "AYM",
  AIHM: "AİHM",
  ICTIHAT: "Diğer içtihat",
};

const FAMILY_ICON: Record<string, typeof Gavel> = {
  YARGITAY: Gavel,
  DANISTAY: Landmark,
  AYM: Landmark,
  AIHM: Scale,
  ICTIHAT: BookOpen,
};

const DATE_PRESETS = [
  { key: "all", label: "Tüm zamanlar", days: null },
  { key: "7", label: "Son 7 gün", days: 7 },
  { key: "30", label: "Son 30 gün", days: 30 },
  { key: "90", label: "Son 90 gün", days: 90 },
  { key: "365", label: "Son 1 yıl", days: 365 },
] as const;

const TITLE = "İçtihat Arama — Yargıtay, Danıştay ve AYM Kararları";
const DESC =
  "Yargıtay, Danıştay, AYM ve AİHM içtihatlarında daire, anahtar kelime ve tarihe göre gelişmiş arama yapın.";

export const Route = createFileRoute("/ictihat")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Türkiye Hukuk Master AI` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IctihatSearchPage,
  errorComponent: ({ error }) => (
    <div className="max-w-2xl mx-auto p-10 text-center">
      <h1 className="font-serif text-2xl mb-2">İçtihat arşivi yüklenemedi</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="max-w-2xl mx-auto p-10 text-center">
      <h1 className="font-serif text-2xl mb-2">Sayfa bulunamadı</h1>
      <Link to="/" className="text-primary hover:underline text-sm">
        Ana sayfa
      </Link>
    </div>
  ),
});

function normalize(s: string) {
  return s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
}

function fmtDate(d: string | null) {
  if (!d) return "Yerleşik ilke";
  return new Date(d + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildAskPrompt(it: CaseLawItem): string {
  const parts = [
    "Aşağıdaki içtihadı tarafsız ve sade bir dille açıkla: konusu, dayandığı hukuki mesele ve varılan sonuç nedir? Sadece içeriği özetle; uyarı, tavsiye veya kişisel yorum ekleme.",
    "",
    `Başlık: ${it.title}`,
    `Merci: ${it.court}`,
  ];
  if (it.ref) parts.push(`Referans: ${it.ref}`);
  if (it.date) parts.push(`Tarih: ${it.date}`);
  if (it.url) parts.push(`Bağlantı: ${it.url}`);
  parts.push("", "Mevcut özet:", it.summary);
  return parts.join("\n");
}

function IctihatSearchPage() {
  const navigate = useNavigate();
  const fetchAll = useServerFn(searchCaseLaw);
  const createFn = useServerFn(createThread);
  const listThreadsFn = useServerFn(listThreads);

  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string>("ALL");
  const [court, setCourt] = useState<string>("ALL");
  const [origin, setOrigin] = useState<"ALL" | "arsiv" | "guncel">("ALL");
  const [preset, setPreset] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"date" | "court" | "title">("date");
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["ictihat-arsiv"],
    queryFn: () => fetchAll(),
    staleTime: 120_000,
  });

  const items = (q.data ?? []) as CaseLawItem[];

  const courts = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (family === "ALL" || i.family === family) set.add(i.court);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [items, family]);

  const results = useMemo(() => {
    const terms = normalize(query).split(" ").filter(Boolean);
    const presetDays = DATE_PRESETS.find((p) => p.key === preset)?.days ?? null;
    const minDate = presetDays
      ? new Date(Date.now() - presetDays * 86_400_000).toISOString().slice(0, 10)
      : null;

    const list = items.filter((i) => {
      if (family !== "ALL" && i.family !== family) return false;
      if (court !== "ALL" && i.court !== court) return false;
      if (origin !== "ALL" && i.origin !== origin) return false;
      if (minDate || from || to) {
        if (!i.date) return false;
        if (minDate && i.date < minDate) return false;
        if (from && i.date < from) return false;
        if (to && i.date > to) return false;
      }
      if (terms.length > 0) {
        const hay = normalize(
          [i.title, i.summary, i.court, i.ref ?? "", i.tags.join(" ")].join(" "),
        );
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "tr");
      if (sort === "court") return a.court.localeCompare(b.court, "tr");
      return (b.date ?? "0000-00-00").localeCompare(a.date ?? "0000-00-00");
    });
  }, [items, query, family, court, origin, preset, from, to, sort]);

  const activeFilters =
    (query ? 1 : 0) +
    (family !== "ALL" ? 1 : 0) +
    (court !== "ALL" ? 1 : 0) +
    (origin !== "ALL" ? 1 : 0) +
    (preset !== "all" ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  function resetAll() {
    setQuery("");
    setFamily("ALL");
    setCourt("ALL");
    setOrigin("ALL");
    setPreset("all");
    setFrom("");
    setTo("");
    setSort("date");
  }

  async function askAssistant(it: CaseLawItem) {
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

  const selectCls =
    "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-br from-primary/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Ana sayfa
          </Link>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" /> İçtihat Arşivi
          </div>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight">
            Gelişmiş İçtihat Arama
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl">
            Yargıtay, Danıştay, AYM ve AİHM içtihatlarını daire/merci, anahtar kelime ve tarih
            aralığına göre filtreleyin.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search + filters */}
        <section
          aria-label="Arama ve filtreler"
          className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm"
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Anahtar kelime: fazla mesai, ecrimisil, kıdem tazminatı, ihlal…"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["ALL", "YARGITAY", "DANISTAY", "AYM", "AIHM", "ICTIHAT"].map((f) => {
              const active = family === f;
              return (
                <button
                  key={f}
                  onClick={() => {
                    setFamily(f);
                    setCourt("ALL");
                  }}
                  className={`text-xs rounded-full px-3 py-1.5 border transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "ALL" ? "Tümü" : (FAMILY_LABEL[f] ?? f)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Daire / Merci
              <select
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className={selectCls}
              >
                <option value="ALL">Tüm daireler</option>
                {courts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Tarih aralığı
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className={selectCls}
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Kayıt türü
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as typeof origin)}
                className={selectCls}
              >
                <option value="ALL">Tümü</option>
                <option value="guncel">Güncel yayınlar</option>
                <option value="arsiv">Yerleşik içtihat ilkeleri</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Sıralama
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className={selectCls}
              >
                <option value="date">Tarihe göre (yeni → eski)</option>
                <option value="court">Daireye göre</option>
                <option value="title">Başlığa göre (A-Z)</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Başlangıç
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={selectCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Bitiş
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={selectCls}
              />
            </label>
            <button
              onClick={resetAll}
              className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Filtreleri temizle
            </button>
          </div>
        </section>

        {/* Results */}
        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            {q.isLoading ? "Yükleniyor…" : `${results.length} sonuç`}
            {activeFilters > 0 ? ` · ${activeFilters} filtre aktif` : ""}
          </span>
          <span>{items.length} kayıt taranıyor</span>
        </div>

        {!q.isLoading && results.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-serif text-lg mb-1">Sonuç bulunamadı</p>
            <p className="text-sm text-muted-foreground">
              Anahtar kelimeyi kısaltın veya tarih/daire filtrelerini gevşetin.
            </p>
          </div>
        )}

        <ul className="mt-4 space-y-3">
          {results.map((it) => {
            const Icon = FAMILY_ICON[it.family] ?? BookOpen;
            const open = expanded === it.id;
            return (
              <li
                key={it.id}
                className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm transition hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground font-semibold">
                        {it.court}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fmtDate(it.date)}
                      </span>
                      {it.ref && <span className="truncate">{it.ref}</span>}
                    </div>
                    <h2 className="font-serif text-lg leading-snug mt-1.5">{it.title}</h2>
                    <p
                      className={`text-sm text-muted-foreground mt-1.5 whitespace-pre-line ${
                        open ? "" : "line-clamp-3"
                      }`}
                    >
                      {it.summary}
                    </p>

                    {it.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {it.tags.map((t) => (
                          <button
                            key={t}
                            onClick={() => setQuery(t)}
                            className="text-[11px] rounded-full border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground transition"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setExpanded(open ? null : it.id)}
                        className="text-xs rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition"
                      >
                        {open ? "Daralt" : "Tamamını oku"}
                      </button>
                      <button
                        onClick={() => askAssistant(it)}
                        className="text-xs rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 inline-flex items-center gap-1.5 hover:opacity-90 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Asistana sor
                      </button>
                      {it.url && (
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs rounded-lg border border-border px-2.5 py-1.5 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Kaynağı aç
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
