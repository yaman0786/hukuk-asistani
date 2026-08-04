import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listThreads } from "@/lib/threads.functions";
import {
  listDailyUpdates,
  fetchUpdateSource,
  type DailyUpdate,
} from "@/lib/daily-updates.functions";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import {
  Scale,
  FileText,
  Search,
  Shield,
  Zap,
  BookOpen,
  ArrowRight,
  Check,
  Gavel,
  Landmark,
  Sparkles,
  Users,
  Briefcase,
  GraduationCap,
  Newspaper,
  MessageSquareText,
  Clock,
  FileSearch,
  ChevronDown,
  Radio,
  Building2,
  HeartHandshake,
  ShoppingBag,
  Home as HomeIcon,
  Car,
  Baby,
  ScrollText,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Hukuk Asistanı — Profesyonel Türkçe Hukuki Yapay Zekâ Asistanı",
      },
      {
        name: "description",
        content:
          "Türkiye mevzuatı, Yargıtay içtihatları, dilekçe hazırlama ve dosya analizi için profesyonel yapay zekâ hukuk asistanı. Ücretsiz başlayın.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Hukuk Asistanı — Hukuki Yapay Zekâ Asistanı",
      },
      {
        property: "og:description",
        content:
          "Mevzuat araması, içtihat analizi, dilekçe hazırlama ve dosya inceleme tek platformda.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hukuk Asistanı" },
      {
        name: "twitter:description",
        content: "Profesyonel Türkçe hukuki yapay zekâ asistanı.",
      },
    ],
  }),
  component: Landing,
});

// Curated ticker items — güncel hukuki gündem.
// (UYAP/e-Devlet entegrasyonu olmadığından editoryal olarak güncellenir.)
const TICKER: Array<{ tag: string; text: string }> = [
  { tag: "YENİ KANUN", text: "7551 sayılı Kanun ile İş Kanunu m.18 kapsamına yeni istisnalar" },
  { tag: "YARGITAY", text: "HGK E.2025/12 K.2025/89 — Kira uyarlama davasında yeni ilke" },
  { tag: "AYM", text: "Bireysel başvuru: Adil yargılanma hakkı ihlali kararı yayımlandı" },
  { tag: "RESMİ GAZETE", text: "TBK m.344 kira artış oranı düzenlemesi güncellendi" },
  { tag: "DANIŞTAY", text: "Vergi tarhiyatlarında zamanaşımı hesabına ilişkin yeni içtihat" },
  { tag: "AİHM", text: "Türkiye aleyhine ifade özgürlüğü ihlali kararı" },
  { tag: "YENİ KANUN", text: "Tüketici Kanunu değişikliği: cayma süresi 30 güne uzatıldı" },
  { tag: "YARGITAY", text: "2. HD — Velayet değişikliğinde çocuğun üstün yararı ölçütü" },
  { tag: "MEVZUAT", text: "6100 sayılı HMK'da elektronik tebligat kapsamı genişletildi" },
];

const HERO_ROTATION = [
  "boşanma davasında velayet",
  "kira uyarlama davası",
  "işten haksız çıkarma tazminatı",
  "icra takibine itiraz",
  "tüketici hakem heyeti başvurusu",
  "miras paylaşımı ve izale-i şuyu",
];

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!alive) return;
      if (data.user) {
        try {
          // Reuse the most recent thread. Do NOT auto-create — the user opens
          // a new file explicitly from the sidebar's "+" button.
          const existing = await listThreads();
          const latest = (existing ?? []).find((t) => !t.archived) ?? existing?.[0];
          if (latest) {
            navigate({ to: "/chat/$threadId", params: { threadId: latest.id } });
            return;
          }
          setChecking(false);
        } catch {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Yükleniyor…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Marquee — canlı hukuki gündem */}
      <TickerBar />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" aria-label="Ana sayfa" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img src="/assets/hukuk-mark.svg" alt="Hukuk Asistanı ana sayfa" width={36} height={36} className="rounded-[11px] shadow-sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[15px] leading-tight truncate">
              Hukuk Asistanı
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Profesyonel Hukuki Asistan
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <a href="#gundem" className="text-muted-foreground hover:text-foreground">
              Gündem
            </a>
            <a href="#ozellikler" className="text-muted-foreground hover:text-foreground">
              Özellikler
            </a>
            <Link to="/durusma" className="text-muted-foreground hover:text-foreground">
              Duruşma Salonu
            </Link>
            <Link to="/sablonlar" className="text-muted-foreground hover:text-foreground">
              Şablonlar
            </Link>
            <Link to="/fiyatlar" className="text-muted-foreground hover:text-foreground">
              Fiyatlar
            </Link>
            <Link
              to="/rehber/dilekce-nasil-yazilir"
              className="text-muted-foreground hover:text-foreground"
            >
              Rehber
            </Link>
          </nav>
          <Link
            to="/durusma"
            aria-label="Sanal Duruşma Salonu"
            className="md:hidden inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[11px] font-medium text-primary"
          >
            <Gavel className="w-3.5 h-3.5" /> Duruşma
          </Link>
          <Link to="/auth" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Giriş
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="hukuk" size="sm">
              Ücretsiz Başla
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <Hero />
        <TrustStrip />
        <FeatureBento />
        <FinalCta />
      </main>

      <SiteFooter />
      <QuickAccessDock />
      <MobileActionBar />
    </div>
  );
}

function QuickAccessDock() {
  const items = [
    { href: "#asistan", label: "Asistan", icon: MessageSquareText },
    { href: "#ozellikler", label: "Özellikler", icon: Sparkles },
    { href: "#gundem", label: "Gündem", icon: Newspaper },
    { href: "/durusma", label: "Duruşma", icon: Gavel },
    { href: "/sablonlar", label: "Şablonlar", icon: FileText },
  ];
  return (
    <aside className="quick-access-dock" aria-label="Hızlı erişim">
      <div className="quick-access-label">Hızlı erişim</div>
      {items.map(({ href, label, icon: Icon }) =>
        href.startsWith("#") ? (
          <a key={href} href={href} className="quick-access-item" aria-label={label}>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </a>
        ) : (
          <Link key={href} to={href} className="quick-access-item" aria-label={label}>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ),
      )}
    </aside>
  );
}

function MobileActionBar() {
  return (
    <nav className="mobile-action-bar" aria-label="Hızlı işlemler">
      <Link to="/" className="mobile-action-item is-active"><Scale className="h-4 w-4" /><span>Ana sayfa</span></Link>
      <Link to="/sablonlar" className="mobile-action-item"><FileText className="h-4 w-4" /><span>Şablonlar</span></Link>
      <Link to="/durusma" className="mobile-action-item mobile-action-primary"><Gavel className="h-5 w-5" /><span>Duruşma</span></Link>
      <Link to="/ictihat" className="mobile-action-item"><BookOpen className="h-4 w-4" /><span>İçtihat</span></Link>
      <Link to="/auth" className="mobile-action-item"><MessageSquareText className="h-4 w-4" /><span>Asistan</span></Link>
    </nav>
  );
}

/* ------------------------------ Ticker ------------------------------ */

const KIND_LABEL: Record<string, string> = {
  AYM: "AYM",
  YARGITAY: "YARGITAY",
  DANISTAY: "DANIŞTAY",
  AIHM: "AİHM",
  KANUN: "YENİ KANUN",
  RG: "RESMİ GAZETE",
  ICTIHAT: "İÇTİHAT",
};

function kararlarKindFor(k: string): "yargitay" | "aym" | "emsal" | null {
  if (k === "YARGITAY") return "yargitay";
  if (k === "AYM") return "aym";
  if (k === "DANISTAY" || k === "AIHM" || k === "ICTIHAT") return "emsal";
  return null;
}

function TickerBar() {
  const fetchUpdates = useServerFn(listDailyUpdates);
  const q = useQuery({
    queryKey: ["daily-updates", "ticker"],
    queryFn: () => fetchUpdates({ data: { limit: 25 } }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const updates = (q.data ?? []) as DailyUpdate[];
  const hasData = updates.length > 0;
  const doubled = hasData ? [...updates, ...updates] : [...TICKER, ...TICKER];
  return (
    <div className="relative border-b border-primary/20 bg-primary text-primary-foreground overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 flex items-stretch gap-3">
        <div className="hidden sm:flex items-center gap-2 py-2 pr-3 border-r border-primary-foreground/20 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping hidden md:inline-flex" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-medium">
            Bugünün Gündemi ·{" "}
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <TooltipProvider delayDuration={150}>
            <div className="flex gap-10 whitespace-nowrap animate-marquee will-change-transform">
              {doubled.map((raw, i) => {
                if (!hasData) {
                  const it = raw as { tag: string; text: string };
                  return (
                    <span key={i} className="inline-flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-sm bg-primary-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider">
                        {it.tag}
                      </span>
                      <span className="opacity-90">{it.text}</span>
                      <span className="opacity-30">·</span>
                    </span>
                  );
                }
                const u = raw as DailyUpdate;
                const cat = kararlarKindFor(u.kind);
                const label = KIND_LABEL[u.kind] ?? u.kind;
                const text = u.ref ? `${u.title} — ${u.ref}` : u.title;
                const inner = (
                  <>
                    <span className="inline-flex items-center rounded-sm bg-primary-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider">
                      {label}
                    </span>
                    <span className="opacity-95 hover:underline">{text}</span>
                    <span className="opacity-30">·</span>
                  </>
                );
                return (
                  <Tooltip key={`${u.id}-${i}`}>
                    <TooltipTrigger asChild>
                      {cat ? (
                        <Link
                          to="/kararlar/$kind"
                          params={{ kind: cat }}
                          search={{ highlight: u.id }}
                          className="inline-flex items-center gap-2 text-xs text-primary-foreground hover:text-primary-foreground"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <a
                          href={resolveSourceUrl(u)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-primary-foreground hover:text-primary-foreground"
                        >
                          {inner}
                        </a>
                      )}
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-sm whitespace-normal bg-popover text-popover-foreground border border-border shadow-lg"
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                          {label}
                          {u.ref ? ` · ${u.ref}` : ""}
                        </div>
                        <div className="font-medium text-xs leading-snug">{u.title}</div>
                        {u.summary && (
                          <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
                            {u.summary}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground pt-1">
                          {cat ? "Karar sayfasında aç →" : "Kaynağı aç →"}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Hero ------------------------------ */

function Hero() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const target = HERO_ROTATION[idx];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) {
      setTyped(target);
      return;
    }
    if (typed.length < target.length) {
      timeoutRef.current = setTimeout(() => setTyped(target.slice(0, typed.length + 1)), 60);
    } else {
      timeoutRef.current = setTimeout(() => {
        setTyped("");
        setIdx((i) => (i + 1) % HERO_ROTATION.length);
      }, 2400);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [typed, target, reducedMotion]);

  return (
    <section id="asistan" className="legal-surface relative overflow-hidden border-b border-border">
      {/* Ambient background — hidden on mobile for performance */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-primary/15 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 -right-24 w-[560px] h-[560px] rounded-full bg-primary/10 blur-3xl animate-float-slow [animation-delay:-6s]" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-14 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <div className="legal-eyebrow mb-4 inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Türkiye mevzuatına özel · KVKK uyumlu
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.03] tracking-tight">
            Hukuki araştırmayı{" "}
            <span className="relative inline-block">
              <span className="text-primary">dakikalara</span>
              <span className="absolute left-0 right-0 -bottom-1 h-[6px] bg-primary/20 rounded" />
            </span>{" "}
            indiren yapay zekâ.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-xl">
            Mevzuat, Yargıtay içtihatları, dilekçe hazırlama ve dosya analizi tek platformda.
            Avukat, hukuk öğrencisi veya birey — profesyonel Türkçe hukuki asistanınız.
          </p>

          {/* Fake input showcasing typing effect */}
          <div className="mt-8 max-w-xl">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Bir örnek sorun
            </label>
            <div className="mt-2 flex items-stretch rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="pl-4 pr-2 flex items-center text-muted-foreground">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <div className="flex-1 py-3 pr-3 text-sm text-foreground min-w-0 truncate">
                <span className="text-muted-foreground">Örn: </span>
                <span>{typed}</span>
                <span className="inline-block w-[2px] h-4 bg-primary align-middle ml-0.5 animate-caret" />
              </div>
              <Link
                to="/auth"
                className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 text-sm font-medium hover:opacity-90"
              >
                Sor <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link to="/auth">
              <Button variant="hukuk" size="lg" className="w-full sm:w-auto">
                Ücretsiz Başla <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/sablonlar">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Dilekçe Şablonlarını Gör
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> Kredi kartı yok
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> Ücretsiz plan 20 mesaj/saat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> Kaynak gösterimli yanıt
            </span>
          </p>
        </div>

        {/* Chat mockup */}
        <div className="lg:col-span-5">
          <ChatMock />
        </div>
      </div>
    </section>
  );
}

function ChatMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-xl" />
      <div className="legal-card relative rounded-2xl overflow-hidden">
        <div
          className="relative h-44 sm:h-52 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/adalet-hero.png')" }}
          aria-label="Adalet terazisi görseli"
          role="img"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
          <div className="absolute bottom-3 left-4 rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-primary backdrop-blur">
            ADALET
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="text-[11px] text-muted-foreground ml-2 truncate">
            Kira Uyarlama Dosyası — hukuk-ai.app
          </div>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="max-w-[85%] ml-auto rounded-2xl rounded-tr-sm bg-secondary text-secondary-foreground px-3.5 py-2.5">
            Kiracımın son sözleşme artışını kabul etmemesi durumunda kira uyarlama davası açabilir
            miyim? Sözleşme 2022 Mart.
          </div>
          <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-muted/60 text-foreground px-3.5 py-2.5 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
              Kısa Sonuç
            </div>
            <p className="text-foreground/90">
              Ekonomik koşullardaki olağanüstü değişim sebebiyle <strong>TBK m.138</strong>{" "}
              kapsamında <em>uyarlama davası</em> açabilirsiniz. Sözleşmenin kurulduğu tarihe göre
              koşullar Yargıtay içtihadınca değerlendirilir.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Kaynak: TBK m.138
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Yargıtay HGK E.2023/…
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Asistan yazıyor…
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Trust strip ---------------------------- */

function TrustStrip() {
  const items = [
    { icon: BookOpen, label: "10.000+ mevzuat maddesi" },
    { icon: Gavel, label: "Yargıtay & Danıştay içtihatları" },
    { icon: FileText, label: "27+ dilekçe şablonu" },
    { icon: Shield, label: "KVKK uyumlu altyapı" },
    { icon: Landmark, label: "Anayasa · TMK · TBK · TCK" },
  ];
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
        {items.map((it) => (
          <div key={it.label} className="inline-flex items-center gap-2">
            <it.icon className="w-3.5 h-3.5 text-primary" />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------- Gündem section -------------------------- */

function relativeTr(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

const KIND_ICON: Record<string, typeof Gavel> = {
  AYM: Landmark,
  YARGITAY: Gavel,
  DANISTAY: Landmark,
  AIHM: Scale,
  KANUN: ScrollText,
  RG: Newspaper,
  ICTIHAT: BookOpen,
};

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

function GundemSection() {
  const fetchUpdates = useServerFn(listDailyUpdates);
  const fetchSourceFn = useServerFn(fetchUpdateSource);
  const q = useQuery({
    queryKey: ["daily-updates", "gundem-top4"],
    queryFn: () => fetchUpdates({ data: { limit: 4 } }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const items = (q.data ?? []) as DailyUpdate[];

  const [selected, setSelected] = useState<DailyUpdate | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [sourceData, setSourceData] = useState<{
    host: string;
    title: string | null;
    text: string;
    fetched_at: string;
  } | null>(null);

  const openSourceInApp = async (url: string) => {
    setSourceOpen(true);
    setSourceLoading(true);
    setSourceError(null);
    setSourceData(null);
    try {
      const res = await fetchSourceFn({ data: { url } });
      if (!res.ok) setSourceError(res.error);
      else
        setSourceData({
          host: res.host,
          title: res.title,
          text: res.text,
          fetched_at: res.fetched_at,
        });
    } catch (e) {
      setSourceError((e as Error).message || "Kaynak alınamadı.");
    } finally {
      setSourceLoading(false);
    }
  };

  return (
    <section id="gundem" className="mobile-secondary-section border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
              <Newspaper className="w-3.5 h-3.5" /> Sizi İlgilendiren 4 Önemli Karar
            </div>
            <h2 className="font-serif text-2xl md:text-3xl mt-2">
              Öne çıkan güncel kararlar — detay ve kaynak tek tıkla
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Yayımlanan en önemli 4 karar; başlığa tıklayarak detayını ve orijinal kaynağını
              uygulama içinde açabilirsiniz.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <Link
              to="/kararlar/$kind"
              params={{ kind: "emsal" }}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Tüm kararları gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/ictihat"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Gelişmiş içtihat arama <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/durusma"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Sanal duruşma salonu <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>
        </div>
        {q.isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Yakında güncel içerikler eklenecek.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((it) => {
              const Icon = KIND_ICON[it.kind] ?? Gavel;
              return (
                <article
                  key={it.id}
                  onClick={() => setSelected(it)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(it);
                  }}
                  className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 font-semibold">
                      <Icon className="w-3 h-3" /> {KIND_LABEL[it.kind] ?? it.kind}
                    </span>
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {relativeTr(it.published_at)}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg leading-snug mb-2">{it.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {it.summary}
                  </p>
                  {it.ref && (
                    <p className="text-[11px] text-muted-foreground/80 mt-3 font-mono">{it.ref}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-primary inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      Detay <ArrowRight className="w-3 h-3" />
                    </span>
                    <a
                      href={resolveSourceUrl(it)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={it.source ?? "Resmî kaynağı yeni sekmede aç"}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {it.source ?? "Resmî kaynak"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-6">
          Güncel içerikler günlük olarak eklenir. Resmî Gazete, YKD, AYM ve UYAP verileri için
          doğrulama tavsiye edilir.
        </p>
      </div>

      {/* Detay dialogu */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 font-semibold">
                    {KIND_LABEL[selected.kind] ?? selected.kind}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(selected.published_at + "T00:00:00").toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <DialogTitle className="font-serif text-lg leading-snug text-left">
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-sm text-foreground/90 leading-relaxed text-left">
                {selected.summary}
              </DialogDescription>
              <div className="space-y-3 mt-1">
                {selected.ref && (
                  <div className="rounded-md border border-border bg-muted/40 p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Başvuru / Esas / Karar No
                      </p>
                      <p className="text-sm font-mono text-foreground break-words">
                        {selected.ref}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selected.ref!);
                          toast.success("Numara panoya kopyalandı");
                        } catch {
                          toast.error("Kopyalanamadı");
                        }
                      }}
                      className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    >
                      <Copy className="w-3 h-3" /> Kopyala
                    </button>
                  </div>
                )}
                {selected.tags && selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase tracking-wider bg-accent border border-border rounded-full px-2 py-0.5 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openSourceInApp(resolveSourceUrl(selected))}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90"
                  >
                    Kaynağı burada aç
                  </button>
                  <a
                    href={resolveSourceUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Yeni sekmede aç
                  </a>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 text-primary bg-primary/5 px-3 py-1.5 text-xs hover:bg-primary/10"
                  >
                    Asistana sor <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Kaynak içerik dialogu */}
      <Dialog open={sourceOpen} onOpenChange={setSourceOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg leading-snug text-left">
              {sourceData?.title ?? "Kaynak metin"}
            </DialogTitle>
            {sourceData && (
              <DialogDescription className="text-[11px] text-muted-foreground text-left">
                {sourceData.host} · {new Date(sourceData.fetched_at).toLocaleString("tr-TR")}
              </DialogDescription>
            )}
          </DialogHeader>
          {sourceLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Kaynak yükleniyor…
            </div>
          ) : sourceError ? (
            <p className="text-sm text-destructive">{sourceError}</p>
          ) : sourceData ? (
            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90 font-sans">
              {sourceData.text}
            </pre>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* --------------------- Karar kategorileri (giriş kartları) --------------------- */

function KararKategorileri() {
  const cards: Array<{
    to: "/kararlar/$kind";
    kind: "yargitay" | "aym" | "emsal";
    icon: typeof Gavel;
    title: string;
    desc: string;
    tint: string;
  }> = [
    {
      to: "/kararlar/$kind",
      kind: "yargitay",
      icon: Gavel,
      title: "Yargıtay Kararları",
      desc: "Hukuk ve Ceza Genel Kurulu ile daire kararları — canlı akış.",
      tint: "from-primary/15 to-primary/0",
    },
    {
      to: "/kararlar/$kind",
      kind: "aym",
      icon: Landmark,
      title: "Anayasa Mahkemesi",
      desc: "Bireysel başvuru ve norm denetimi kararları, ihlal tespitleri.",
      tint: "from-amber-500/15 to-amber-500/0",
    },
    {
      to: "/kararlar/$kind",
      kind: "emsal",
      icon: BookOpen,
      title: "Emsal Kararlar & İçtihat",
      desc: "Yargıtay, Danıştay, AİHM ve içtihat kararları bir arada.",
      tint: "from-emerald-500/15 to-emerald-500/0",
    },
  ];
  return (
    <section id="kararlar" className="mobile-secondary-section border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
              <Scale className="w-3.5 h-3.5" /> Kategoriye Göre Karar Arşivi
            </div>
            <h2 className="font-serif text-2xl md:text-3xl mt-2">
              Tüm kararları kategorisiyle keşfedin
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Yargıtay, Anayasa Mahkemesi ve emsal içtihat kararlarının canlı akışını tek tıkla
              açın; kaynak bağlantıları ve başvuru numaralarıyla birlikte görüntüleyin.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.kind}
                to={c.to}
                params={{ kind: c.kind }}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.tint} opacity-70 group-hover:opacity-100 transition`}
                />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    Kararları gör <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Feature bento ------------------------- */

function FeatureBento() {
  return (
    <section id="ozellikler" className="border-b border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Özellikler
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">
            Hukuk profesyonelleri için tasarlandı
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 text-sm">
            Araştırmadan dilekçeye, dosya analizinden strateji önerisine kadar her adımda yanınızda.
          </p>
        </div>

        <div className="grid md:grid-cols-6 gap-4">
          {/* Big card 1 */}
          <div className="md:col-span-4 rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl mb-2">Mevzuat & İçtihat Motoru</h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              Anayasa, TMK, TBK, TCK, HMK, CMK, İş Kanunu, Tüketici Kanunu ve daha fazlası. RAG
              destekli semantik arama; her yanıtta
              <span className="text-foreground"> [Kaynak: ...] </span>
              formatında zorunlu atıf.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["TMK m.166", "TBK m.299", "İş K. m.18", "HMK m.114", "TCK m.86"].map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded border border-border bg-background text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Small card 1 */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg mb-2">Dilekçe Hazırlama</h3>
            <p className="text-sm text-muted-foreground">
              27+ hazır şablon; boşluklar doldurulur, mahkeme diline uygun çıktı alırsınız. PDF,
              DOCX, Markdown olarak indirin.
            </p>
          </div>

          {/* Small card 2 */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileSearch className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg mb-2">Dosya Analizi</h3>
            <p className="text-sm text-muted-foreground">
              PDF ve görselleri yükleyin; sözleşme, tebligat, karar veya bilirkişi raporunu birlikte
              okuyalım.
            </p>
          </div>

          {/* Big card 2 */}
          <div className="md:col-span-4 rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl mb-2">Güvenli & KVKK Uyumlu</h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              Uçtan uca RLS ile veri izolasyonu, sesli girdiler cihazınızda işlenir, verilerinizi
              tek tıkla dışa aktarın veya silin. Yanıtlar hâkim gibi kesin ifade yerine ölçülü ve
              gerekçeli üretilir.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> RLS izolasyon
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> Rate limit koruması
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> Veri dışa aktarma
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> Hesap silme
              </span>
            </div>
          </div>

          {/* Row of 3 */}
          {[
            {
              icon: Zap,
              title: "Hızlı & Odaklı",
              body: "Sesli giriş, komut paleti ⌘K, thread yönetimi.",
            },
            {
              icon: Radio,
              title: "Canlı Yayın Yanıt",
              body: "Yanıtlar akan biçimde gelir; beklemeden okumaya başlayın.",
            },
            {
              icon: Scale,
              title: "Kaynak Gösterimli",
              body: "Her hukuki iddia için mevzuat/karar atfı zorunludur.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="md:col-span-2 rounded-2xl border border-border bg-card p-6"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------- Uzmanlık grid -------------------------- */

function UzmanlikGrid() {
  const items = [
    { icon: HeartHandshake, label: "Aile Hukuku", sub: "Boşanma · Velayet · Nafaka" },
    { icon: Briefcase, label: "İş Hukuku", sub: "İşe iade · Tazminat · Mobbing" },
    { icon: ShoppingBag, label: "Tüketici", sub: "Ayıplı mal · Hakem heyeti" },
    { icon: HomeIcon, label: "Kira & Gayrimenkul", sub: "Uyarlama · Tahliye · Tapu" },
    { icon: Gavel, label: "İcra & İflas", sub: "İtiraz · Tahsil · Haciz" },
    { icon: Shield, label: "Ceza Hukuku", sub: "Şikayet · Katılma · Savunma" },
    { icon: Car, label: "Trafik & Sigorta", sub: "Kaza · Tazminat · Rücu" },
    { icon: Baby, label: "Miras Hukuku", sub: "Paylaşım · İzale-i şuyu" },
  ];
  return (
    <section className="landing-optional-section border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Scale className="w-3.5 h-3.5" /> Uzmanlık Alanları
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">Türk hukukunun geniş yelpazesi</h2>
          <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">
            Sorununuz hangi alana giriyorsa, ilk soruyu sorduğunuz anda ilgili mevzuat ve içtihat
            çerçevesi hazır.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((it) => (
            <Link
              key={it.label}
              to="/auth"
              className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition">
                  <it.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-sm truncate">{it.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{it.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Popular templates ----------------------- */

function PopularTemplates() {
  const items = [
    { title: "Kira Tespit Davası", cat: "Kira & Gayrimenkul" },
    { title: "İtirazın İptali Davası", cat: "İcra & İflas" },
    { title: "İşe İade Davası", cat: "İş Hukuku" },
    { title: "Anlaşmalı Boşanma Protokolü", cat: "Aile Hukuku" },
    { title: "Tüketici Hakem Heyeti Başvurusu", cat: "Tüketici" },
    { title: "Suç Duyurusu Dilekçesi", cat: "Ceza Hukuku" },
  ];
  return (
    <section className="mobile-secondary-section border-b border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
              <FileText className="w-3.5 h-3.5" /> Popüler Şablonlar
            </div>
            <h2 className="font-serif text-2xl md:text-3xl mt-2">En çok kullanılan dilekçeler</h2>
          </div>
          <Link
            to="/sablonlar"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Tüm şablonlar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {items.map((t) => (
            <Link
              key={t.title}
              to="/sablonlar"
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{t.title}</div>
                <div className="text-[11px] text-muted-foreground">{t.cat}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- How it works ---------------------------- */

function HowItWorks() {
  const steps = [
    {
      icon: MessageSquareText,
      title: "Sorununu yaz",
      body: "Olayı tarih, kişiler ve varsa belgelerle birlikte anlat. Ne kadar ayrıntı verirsen strateji o kadar isabetli olur.",
    },
    {
      icon: FileSearch,
      title: "Asistan analiz eder",
      body: "İlgili mevzuat ve içtihat çıkarılır, delil durumu değerlendirilir; karşı tarafın olası savunması da düşünülür.",
    },
    {
      icon: Gavel,
      title: "Uygulanabilir plan al",
      body: "En güvenli hukuki yol, süreler, toplanacak belgeler ve gerekirse dilekçe metni ile birlikte adım adım plan.",
    },
  ];
  return (
    <section className="landing-optional-section mobile-secondary-section border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Zap className="w-3.5 h-3.5" /> Nasıl Çalışır
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">
            Üç adımda profesyonel hukuki çıktı
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center relative z-10">
                <s.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-serif text-lg mt-5 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Personas ------------------------------ */

function Personas() {
  const [active, setActive] = useState<"birey" | "avukat" | "ogrenci">("birey");
  const data = useMemo(
    () => ({
      birey: {
        icon: Users,
        title: "Bireyler için",
        body: "Karmaşık hukuki dille boğulmadan haklarınızı anlayın, süre kaybetmeden atmanız gereken adımları öğrenin.",
        bullets: [
          "Anlaşılır Türkçe ile açıklama",
          "Örnek dilekçeler ve başvuru yolları",
          "Süre uyarıları — hak düşürücü süreleri kaçırmayın",
        ],
      },
      avukat: {
        icon: Briefcase,
        title: "Avukatlar için",
        body: "Ön araştırma, dilekçe taslağı, karşı savunma senaryosu ve içtihat taraması için hızlı bir yardımcı.",
        bullets: [
          "Kaynak gösterimli mevzuat ve karar taraması",
          "Dosya bazında bağlam korunur",
          "PDF/DOCX çıktı ile hızlı derleme",
        ],
      },
      ogrenci: {
        icon: GraduationCap,
        title: "Hukuk öğrencileri için",
        body: "Vaka analizi, sınav hazırlığı ve ödevler için doğru kavramlarla düşünmenizi sağlayan bir çalışma partneri.",
        bullets: [
          "Kavram açıklamaları ve karşılaştırmalar",
          "Örnek olay üzerinden analiz",
          "Kaynaklı özet ve tekrar notları",
        ],
      },
    }),
    [],
  );
  const cur = data[active];
  const tabs: Array<{ key: keyof typeof data; label: string; icon: typeof Users }> = [
    { key: "birey", label: "Bireyler", icon: Users },
    { key: "avukat", label: "Avukatlar", icon: Briefcase },
    { key: "ogrenci", label: "Öğrenciler", icon: GraduationCap },
  ];
  return (
    <section className="landing-optional-section mobile-secondary-section border-b border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Building2 className="w-3.5 h-3.5" /> Kimler İçin
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">
            Her hukuki ihtiyaca uygun yaklaşım
          </h2>
        </div>
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition " +
                  (active === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <cur.icon className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl">{cur.title}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">{cur.body}</p>
          <ul className="space-y-2 text-sm">
            {cur.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Stats band ----------------------------- */

function StatsBand() {
  const stats = [
    { n: "10.000+", l: "mevzuat maddesi" },
    { n: "27+", l: "dilekçe şablonu" },
    { n: "8", l: "hukuk uzmanlık alanı" },
    { n: "24/7", l: "her an erişim" },
  ];
  return (
    <section className="landing-optional-section mobile-secondary-section border-b border-border bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="font-serif text-3xl md:text-4xl">{s.n}</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Testimonials ---------------------------- */

function Testimonials() {
  const items = [
    {
      quote:
        "Kira uyarlama dosyamda mevzuatı ve Yargıtay içtihatlarını dakikalar içinde bir arada gördüm. Süre kazandırdı.",
      name: "Av. E. Yıldız",
      role: "Serbest avukat, Ankara",
    },
    {
      quote:
        "İşten çıkarıldıktan sonra ne yapmam gerektiğini adım adım anlattı. Dilekçemi de birlikte hazırladık.",
      name: "M. Kaya",
      role: "Kullanıcı",
    },
    {
      quote:
        "Vaka analizlerinde kavramları doğru kullanmamı sağladı. Kaynak gösteriyor olması hocalarım için de güven verdi.",
      name: "S. Demir",
      role: "Hukuk fakültesi, 3. sınıf",
    },
  ];
  return (
    <section className="landing-optional-section mobile-secondary-section border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Star className="w-3.5 h-3.5" /> Kullanıcı Yorumları
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">
            Meslektaşlar ve bireyler ne diyor?
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-sm text-foreground/90 leading-relaxed flex-1">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 pt-4 border-t border-border">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Pricing preview ---------------------------- */

function PricingPreview() {
  const plans = [
    {
      name: "Ücretsiz",
      price: "0₺",
      perks: ["20 mesaj/saat", "200 mesaj/gün", "Temel şablonlar"],
    },
    {
      name: "Pro",
      price: "299₺/ay",
      perks: ["120 mesaj/saat", "2000 mesaj/gün", "Tüm şablonlar", "Öncelikli hız"],
      highlight: true,
    },
    {
      name: "Kurumsal",
      price: "999₺/ay",
      perks: ["600 mesaj/saat", "10000 mesaj/gün", "Ekip yönetimi", "Öncelikli destek"],
    },
  ];
  return (
    <section className="landing-optional-section mobile-secondary-section border-b border-border bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Landmark className="w-3.5 h-3.5" /> Fiyatlandırma
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">Her ölçekte ihtiyaca uygun</h2>
          <p className="text-muted-foreground text-sm mt-3">
            Ücretsiz başlayın, ihtiyacınıza göre yükseltin.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-left">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "rounded-2xl border p-6 relative " +
                (p.highlight ? "border-primary bg-card shadow-lg" : "border-border bg-card")
              }
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  En Popüler
                </div>
              )}
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {p.name}
              </div>
              <div className="font-serif text-3xl mb-4">{p.price}</div>
              <ul className="space-y-2 text-sm">
                {p.perks.map((per) => (
                  <li key={per} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{per}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/fiyatlar">
            <Button variant="outline">Tüm karşılaştırma</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- FAQ ------------------------------- */

function FaqSection() {
  const faqs = [
    {
      q: "Yapay zekâ hukuki tavsiye verir mi?",
      a: "Hayır. Türkiye Hukuk Master AI hukuki bilgi ve strateji önerileri sunar; ancak bağlayıcı hukuki tavsiye niteliği taşımaz. Kritik dosyalarda bir avukatla teyit önerilir.",
    },
    {
      q: "e-Devlet veya UYAP'a bağlanıyor mu?",
      a: "Hayır. Dosyanızı UYAP'tan otomatik çekmez. Ancak belgeleri (PDF/görsel) yükleyerek asistanla birlikte analiz edebilirsiniz.",
    },
    {
      q: "Verilerim güvende mi?",
      a: "Uçtan uca RLS ile veri izolasyonu uygulanır; verilerinizi tek tıkla dışa aktarabilir veya silebilirsiniz. KVKK uyumluluğu için Gizlilik Politikamıza bakın.",
    },
    {
      q: "Hangi mevzuat ve içtihatları kapsıyor?",
      a: "Anayasa, TMK, TBK, TCK, HMK, CMK, İş Kanunu, Tüketici Kanunu başta olmak üzere geniş bir mevzuat; Yargıtay, Danıştay, AYM ve AİHM içtihatları taranır.",
    },
    {
      q: "Ücretsiz plan yeterli mi?",
      a: "Bireysel kullanım için 20 mesaj/saat, 200 mesaj/gün limiti çoğunlukla yeterlidir. Yoğun kullanım için Pro veya Kurumsal planı deneyin.",
    },
  ];
  return (
    <section id="sss" className="landing-optional-section mobile-secondary-section border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <MessageSquareText className="w-3.5 h-3.5" /> Sıkça Sorulanlar
          </div>
          <h2 className="font-serif text-2xl md:text-3xl mt-2">Merak edilenler</h2>
        </div>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="font-medium text-sm">{f.q}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Final CTA ------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-3xl md:text-4xl leading-tight">
          Bir sonraki hukuki adımınızı <span className="text-primary">bilerek</span> atın.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Ücretsiz hesap oluşturun, ilk dosyanızı bugün açın. Kredi kartı istemez.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth">
            <Button variant="hukuk" size="lg" className="w-full sm:w-auto">
              Ücretsiz Hesap Oluştur <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/sablonlar">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Şablonlara Göz At
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Footer ------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src="/assets/hukuk-mark.svg" alt="" width={32} height={32} className="rounded-[9px]" />
            <div className="font-serif text-sm">Hukuk Asistanı</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 max-w-sm">
            Türkiye mevzuatı ve içtihatları üzerine eğitilmiş profesyonel hukuki yapay zekâ
            asistanı. Bu araç hukuki tavsiye niteliği taşımaz.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Ürün</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/sablonlar" className="hover:text-primary">
                Şablonlar
              </Link>
            </li>
            <li>
              <Link to="/fiyatlar" className="hover:text-primary">
                Fiyatlar
              </Link>
            </li>
            <li>
              <Link to="/rehber/dilekce-nasil-yazilir" className="hover:text-primary">
                Rehber
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Yasal</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/gizlilik" className="hover:text-primary">
                Gizlilik
              </Link>
            </li>
            <li>
              <Link to="/kullanim-sartlari" className="hover:text-primary">
                Kullanım Şartları
              </Link>
            </li>
            <li>
              <Link to="/kvkk" className="hover:text-primary">
                KVKK
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Faydalı Resmî Bağlantılar
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              { href: "https://www.turkiye.gov.tr", label: "e-Devlet" },
              { href: "https://vatandas.uyap.gov.tr", label: "UYAP Vatandaş" },
              { href: "https://www.resmigazete.gov.tr", label: "Resmî Gazete" },
              { href: "https://www.mevzuat.gov.tr", label: "Mevzuat.gov.tr" },
              { href: "https://karararama.yargitay.gov.tr", label: "Yargıtay Karar Arama" },
              { href: "https://karararama.danistay.gov.tr", label: "Danıştay Karar Arama" },
              { href: "https://kararlarbilgibankasi.anayasa.gov.tr", label: "AYM Karar Bankası" },
              { href: "https://hudoc.echr.coe.int", label: "AİHM HUDOC" },
            ].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition"
                >
                  <ExternalLink className="w-3 h-3" /> {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-2 items-center justify-between text-[11px] text-muted-foreground">
          <div>© {new Date().getFullYear()} Hukuk Asistanı</div>
          <div>Made with care for Turkish legal professionals.</div>
        </div>
      </div>
    </footer>
  );
}
