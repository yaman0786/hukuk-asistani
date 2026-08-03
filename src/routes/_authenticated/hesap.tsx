import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "sonner";
import { openCustomerPortal } from "@/lib/subscription.functions";
import { exportMyData, deleteMyAccount } from "@/lib/threads.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/hesap")({
  head: () => ({
    meta: [
      { title: "Hesabım — Türkiye Hukuk Master AI" },
      { name: "description", content: "Abonelik, fatura, veri ve hesap yönetimi." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const { sub, tier, loading } = useSubscription(userId);
  const portalFn = useServerFn(openCustomerPortal);
  const exportFn = useServerFn(exportMyData);
  const deleteAccountFn = useServerFn(deleteMyAccount);
  const [portalLoading, setPortalLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      setEmail(data.user?.email ?? undefined);
    });
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") === "success") {
      toast.success("Ödeme alındı — aboneliğiniz birkaç saniye içinde etkinleşecek.");
    }
  }, []);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await portalFn();
      if (res.url) window.open(res.url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hukuk-master-ai-veri-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Verileriniz indirildi.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmText = window.prompt(
      'Hesabınızı ve tüm verilerinizi kalıcı olarak silmek üzeresiniz. Onaylamak için "SİL" yazın.',
    );
    if (confirmText !== "SİL") {
      toast.error("İşlem iptal edildi.");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccountFn();
      await supabase.auth.signOut();
      toast.success("Hesabınız silindi.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PaymentTestModeBanner />
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Sohbet
          </Link>
          <h1 className="ml-auto font-serif text-lg">Hesabım</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-xl border border-border p-6 bg-card">
          <h2 className="font-serif text-lg mb-4">Profil</h2>
          <div className="text-sm text-muted-foreground">E-posta</div>
          <div className="mb-4">{email ?? "…"}</div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
          </Button>
        </section>

        <section className="rounded-xl border border-border p-6 bg-card">
          <h2 className="font-serif text-lg mb-4">Abonelik</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Mevcut plan</div>
                <div className="font-medium capitalize">{tier}</div>
              </div>
              {sub && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">Durum</div>
                    <div className="text-sm">{sub.status}</div>
                  </div>
                  {sub.current_period_end && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        {sub.cancel_at_period_end ? "Erişim bitiş" : "Yenileme"}
                      </div>
                      <div className="text-sm">
                        {new Date(sub.current_period_end).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                  )}
                  {sub.cancel_at_period_end && sub.current_period_end && (
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs p-3 mb-4">
                      Aboneliğiniz iptal edildi. Dönem sonuna (
                      {new Date(sub.current_period_end).toLocaleDateString("tr-TR")}) kadar erişim
                      devam eder.
                    </div>
                  )}
                </>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {tier === "free" ? (
                  <Link to="/fiyatlar">
                    <Button>Planları Görüntüle</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/fiyatlar">
                      <Button variant="outline">Plan Değiştir</Button>
                    </Link>
                    <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
                      {portalLoading ? "Açılıyor…" : "Ödeme / İptal Yönetimi"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border p-6 bg-card">
          <h2 className="font-serif text-lg mb-4">Verilerim</h2>
          <p className="text-sm text-muted-foreground mb-4">
            KVKK kapsamında verilerinizi dilediğiniz zaman indirebilir veya hesabınızı kalıcı olarak
            silebilirsiniz.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Hazırlanıyor…" : "Verilerimi İndir (JSON)"}
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Siliniyor…" : "Hesabımı Sil"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
