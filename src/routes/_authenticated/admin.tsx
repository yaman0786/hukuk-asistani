import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminOverview,
  isAdmin,
  resetUserStrikes,
  adminRefreshUpdates,
  adminUpdatesStatus,
} from "@/lib/admin.functions";
import { seedLegalCorpus, seedLegalStatus } from "@/lib/seed-legal.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Shield, Database, Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Türkiye Hukuk Master AI" },
      { name: "description", content: "Yönetim paneli." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const res = await isAdmin();
    if (!res.admin) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

function AdminPage() {
  const fn = useServerFn(adminOverview);
  const resetFn = useServerFn(resetUserStrikes);
  const seedFn = useServerFn(seedLegalCorpus);
  const seedStatusFn = useServerFn(seedLegalStatus);
  const refreshFn = useServerFn(adminRefreshUpdates);
  const statusFn = useServerFn(adminUpdatesStatus);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
  const seedQ = useQuery({ queryKey: ["seed-legal-status"], queryFn: () => seedStatusFn() });
  const statusQ = useQuery({
    queryKey: ["admin-updates-status"],
    queryFn: () => statusFn(),
    refetchInterval: 60_000,
  });
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleReset(userId: string) {
    try {
      await resetFn({ data: { userId } });
      toast.success("Strike sıfırlandı");
      q.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await seedFn();
      toast.success(
        `Mevzuat yüklendi: +${res.inserted} yeni, ${res.backfilled} embedding tamamlandı, ${res.skipped} atlandı, ${res.failed} hata`,
      );
      seedQ.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await refreshFn();
      const srcs =
        Object.entries(res.sources ?? {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ") || "—";
      toast.success(`Gündem güncellendi: +${res.inserted} yeni (${srcs})`);
      statusQ.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
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
            <ArrowLeft className="w-4 h-4" /> Chat
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-serif">Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {q.isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {q.data && (
          <>
            <section>
              <h1 className="text-2xl font-serif mb-4">Genel Bakış</h1>
              <div className="grid grid-cols-3 gap-4">
                <Card label="Dosyalar" value={q.data.counts.threads} />
                <Card label="Mesajlar" value={q.data.counts.messages} />
                <Card label="Aktif Kullanıcılar" value={q.data.counts.activeUsers} />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> RAG Mevzuat & İçtihat Veritabanı
              </h2>
              <div className="border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    Yüklü / Toplam
                  </div>
                  <div className="font-serif text-lg mt-1">
                    {seedQ.data
                      ? `${seedQ.data.seeded.toLocaleString("tr-TR")} / ${seedQ.data.total.toLocaleString("tr-TR")}`
                      : "—"}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    İçtihat kaydı
                  </div>
                  <div className="font-serif text-lg mt-1">
                    {seedQ.data
                      ? `${seedQ.data.caseLaw.toLocaleString("tr-TR")} / ${seedQ.data.caseLawTotal.toLocaleString("tr-TR")}`
                      : "—"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground max-w-md">
                  Temel kanun maddeleri ile Yargıtay, Danıştay ve AYM yerleşik içtihat özetleri
                  embedding'lenip RAG için yüklenir. Tekrar tetiklenirse eksikler tamamlanır,
                  mevcutlar atlanır.
                </p>

                <Button variant="hukuk" onClick={handleSeed} disabled={seeding} className="ml-auto">
                  {seeding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Yükleniyor...
                    </>
                  ) : (
                    "Mevzuatı Yükle / Güncelle"
                  )}
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Günlük Gündem (Resmî Gazete + AYM)
              </h2>
              <div className="border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
                <p className="text-xs text-muted-foreground max-w-md">
                  Resmî Gazete günlük fihristi ve Anayasa Mahkemesi basın duyuruları otomatik olarak
                  her 4 saatte bir çekilir. Buradan manuel de tetikleyebilirsin.
                </p>
                <Button
                  variant="hukuk"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="ml-auto"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Şimdi Güncelle
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-3 border border-border rounded-lg p-4 bg-muted/20">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Son Güncelleme Durumu
                </div>
                {statusQ.isLoading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
                {statusQ.data && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Son çalıştırma</div>
                      <div className="font-serif text-sm mt-1">
                        {statusQ.data.lastRunAt
                          ? new Date(statusQ.data.lastRunAt).toLocaleString("tr-TR")
                          : "—"}
                      </div>
                      {statusQ.data.lastBatchAt && (
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Son partide {statusQ.data.lastBatchCount} yeni kayıt
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Son 1 saat</div>
                      <div className="font-serif text-lg mt-1">+{statusQ.data.last1hCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Son 24 saat</div>
                      <div className="font-serif text-lg mt-1">+{statusQ.data.last24hCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Toplam kayıt</div>
                      <div className="font-serif text-lg mt-1">
                        {statusQ.data.totalCount.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Kaynaklara göre (24s)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusQ.data.sources24).length === 0 && (
                          <span className="text-xs text-muted-foreground">Kayıt yok</span>
                        )}
                        {Object.entries(statusQ.data.sources24)
                          .sort((a, b) => b[1] - a[1])
                          .map(([src, n]) => (
                            <span
                              key={src}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-background text-xs"
                            >
                              <span className="font-mono">{src}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="font-serif">{n}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        İşlem türüne göre (24s)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusQ.data.kinds24).length === 0 && (
                          <span className="text-xs text-muted-foreground">Kayıt yok</span>
                        )}
                        {Object.entries(statusQ.data.kinds24)
                          .sort((a, b) => b[1] - a[1])
                          .map(([k, n]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                            >
                              <span className="font-serif">{k}</span>
                              <span className="opacity-60">·</span>
                              <span>{n}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif mb-2">Abuse Strikes</h2>
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Kullanıcı</th>
                      <th className="text-left px-3 py-2">Strike</th>
                      <th className="text-left px-3 py-2">Blok Bitişi</th>
                      <th className="text-left px-3 py-2">Son</th>
                      <th className="text-right px-3 py-2">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data.strikes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-muted-foreground text-center">
                          Kayıt yok
                        </td>
                      </tr>
                    )}
                    {q.data.strikes.map((s) => (
                      <tr key={s.user_id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-xs">
                          {String(s.user_id).slice(0, 8)}…
                        </td>
                        <td className="px-3 py-2">{s.strike_count}</td>
                        <td className="px-3 py-2 text-xs">
                          {s.blocked_until
                            ? new Date(s.blocked_until).toLocaleString("tr-TR")
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {new Date(s.last_strike_at).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReset(String(s.user_id))}
                          >
                            Sıfırla
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif mb-2">Negatif Feedback</h2>
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Tarih</th>
                      <th className="text-left px-3 py-2">Kullanıcı</th>
                      <th className="text-left px-3 py-2">Sebep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data.negativeFeedback.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-muted-foreground text-center">
                          Kayıt yok
                        </td>
                      </tr>
                    )}
                    {q.data.negativeFeedback.map((f, i) => (
                      <tr key={`${f.message_id}-${i}`} className="border-t border-border">
                        <td className="px-3 py-2 text-xs">
                          {new Date(f.created_at as string).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {String(f.user_id).slice(0, 8)}…
                        </td>
                        <td className="px-3 py-2 text-xs">{f.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-serif mt-1">{value.toLocaleString("tr-TR")}</div>
    </div>
  );
}
