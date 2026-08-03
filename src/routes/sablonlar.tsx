import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listTemplates, startFromTemplate } from "@/lib/templates.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Scale, FileText, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sablonlar")({
  validateSearch: (search: Record<string, unknown>): { kategori?: string } =>
    typeof search.kategori === "string" ? { kategori: search.kategori } : {},
  head: () => ({
    meta: [
      { title: "Dilekçe Şablonları — Türkiye Hukuk Master AI" },
      {
        name: "description",
        content:
          "Boşanma, işe iade, icra itirazı, tüketici hakem, kira tespit, ceza savunma dahil hazır Türkçe hukuk dilekçe şablonları.",
      },
      { property: "og:title", content: "Dilekçe Şablonları — Türkiye Hukuk Master AI" },
      {
        property: "og:description",
        content: "Değişkenleri doldurun, AI hemen dilekçenizi hazırlasın.",
      },
    ],
  }),
  component: TemplatesPage,
});

type Variable = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

function TemplatesPage() {
  const listFn = useServerFn(listTemplates);
  const startFn = useServerFn(startFromTemplate);
  const navigate = useNavigate();
  const { kategori } = Route.useSearch();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string | null>(kategori ?? null);
  const [active, setActive] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const templatesQ = useQuery({ queryKey: ["templates"], queryFn: () => listFn() });

  const kinds = useMemo(() => {
    const set = new Set<string>();
    (templatesQ.data ?? []).forEach((t) => set.add(t.kind));
    return Array.from(set).sort();
  }, [templatesQ.data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    const all = templatesQ.data ?? [];
    return all.filter((t) => {
      if (kind && t.kind !== kind) return false;
      if (!s) return true;
      return (
        t.title.toLocaleLowerCase("tr").includes(s) ||
        t.description.toLocaleLowerCase("tr").includes(s) ||
        t.kind.toLocaleLowerCase("tr").includes(s)
      );
    });
  }, [q, kind, templatesQ.data]);

  const activeTpl =
    filtered.find((t) => t.id === active) ?? templatesQ.data?.find((t) => t.id === active);
  const vars = (activeTpl?.variables as Variable[] | undefined) ?? [];

  async function handleStart() {
    if (!activeTpl) return;
    setBusy(true);
    try {
      // Şablondan dilekçe hazırlamak için giriş şart — aksi halde server fn 401 döner.
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast.info("Dilekçe hazırlamak için giriş yapın.");
        navigate({ to: "/auth" });
        return;
      }
      const { threadId, prompt } = await startFn({ data: { slug: activeTpl.slug, values } });

      // Hand the filled prompt to the chat page via sessionStorage so it auto-sends
      // and the AI actually generates + streams the dilekçe content on screen.
      try {
        sessionStorage.setItem(`autosend:${threadId}`, prompt);
      } catch {
        // ignore storage errors (private mode etc.)
      }
      toast.success("Dilekçe hazırlanıyor...");
      navigate({ to: "/chat/$threadId", params: { threadId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Ana sayfa
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <span className="font-serif">Dilekçe Şablonları</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif mb-2">Hazır Dilekçe Şablonları</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Bir şablon seçin, değişkenleri doldurun; AI dilekçeyi hazırlayıp yeni bir dosya açacak.
        </p>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Şablon ara: boşanma, icra, işe iade..."
            className="w-full pl-9 pr-3 py-3 sm:py-2 rounded-md border border-border bg-background text-base sm:text-sm"
          />
        </div>

        {kinds.length > 0 && (
          <div className="mb-6 -mx-4 sm:mx-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 px-4 sm:px-0 pb-1">
              <button
                onClick={() => setKind(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition ${
                  kind === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Tümü
              </button>
              {kinds.map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(kind === k ? null : k)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition capitalize ${
                    kind === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {templatesQ.isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {templatesQ.data && templatesQ.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Şablonlar henüz yüklenmedi. Yönetici birazdan ekleyecek.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActive(t.id);
                setValues({});
              }}
              className="text-left p-4 min-h-[88px] border border-border rounded-lg hover:border-primary hover:bg-accent/30 active:bg-accent/50 transition"
            >
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.kind}
                  </div>
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {t.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {activeTpl && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-background border border-border w-full sm:max-w-lg h-[92dvh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="p-4 border-b border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {activeTpl.kind}
              </div>
              <h2 className="font-serif text-lg">{activeTpl.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{activeTpl.description}</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {vars.length === 0 && (
                <p className="text-sm text-muted-foreground">Bu şablon değişkensiz. Devam edin.</p>
              )}
              {vars.map((v) => (
                <div key={v.key}>
                  <label className="text-sm font-medium block mb-1.5">
                    {v.label}
                    {v.required && <span className="text-destructive"> *</span>}
                  </label>
                  {v.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={values[v.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [v.key]: e.target.value }))}
                      placeholder={v.placeholder}
                      className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-base sm:text-sm min-h-[96px]"
                    />
                  ) : (
                    <input
                      value={values[v.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [v.key]: e.target.value }))}
                      placeholder={v.placeholder}
                      className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-base sm:text-sm min-h-[44px]"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2 sm:justify-end pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                variant="ghost"
                onClick={() => setActive(null)}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                Vazgeç
              </Button>
              <Button
                variant="hukuk"
                onClick={handleStart}
                disabled={busy}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                {busy ? "Hazırlanıyor..." : "Dilekçeyi Hazırla"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
