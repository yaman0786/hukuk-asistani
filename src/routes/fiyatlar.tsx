import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "sonner";

export const Route = createFileRoute("/fiyatlar")({
  head: () => ({
    meta: [
      { title: "Fiyatlandırma — Hukuk Asistanı" },
      {
        name: "description",
        content:
          "Ücretsiz, Pro ve Kurumsal planlar. Türkiye hukuk mevzuatına özel AI asistan. Aylık ve yıllık ödeme seçenekleri.",
      },
      { property: "og:title", content: "Fiyatlandırma — Hukuk Asistanı" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hukuk-asistani-eta.vercel.app/fiyatlar" },
    ],
    links: [{ rel: "canonical", href: "https://hukuk-asistani-eta.vercel.app/fiyatlar" }],
  }),
  component: PricingPage,
});

type PlanId = "free" | "pro" | "kurumsal";

const PLANS: Array<{
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  monthly: number;
  yearly: number;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "free",
    name: "Ücretsiz",
    tagline: "Deneme ve hafif kullanım",
    monthly: 0,
    yearly: 0,
    features: [
      "20 mesaj/saat, 200 mesaj/gün",
      "Gemini 2.5 Pro erişimi",
      "PDF/görsel yükleme (5 dosya)",
      "Temel şablonlar",
      "Sohbet paylaşımı",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Avukatlar ve yoğun kullanıcılar için",
    monthlyPriceId: "hukuk_pro_monthly",
    yearlyPriceId: "hukuk_pro_yearly",
    monthly: 299,
    yearly: 2990,
    highlight: true,
    features: [
      "120 mesaj/saat, 2000 mesaj/gün",
      "Öncelikli işlem sırası",
      "Tüm 18+ dilekçe şablonu",
      "PDF & DOCX dışa aktarma",
      "Klasör, arşiv, etiketleme",
      "MCP entegrasyonu (agent)",
      "E-posta desteği",
    ],
  },
  {
    id: "kurumsal",
    name: "Kurumsal",
    tagline: "Hukuk büroları ve ekipler için",
    monthlyPriceId: "hukuk_kurumsal_monthly",
    yearlyPriceId: "hukuk_kurumsal_yearly",
    monthly: 999,
    yearly: 9990,
    features: [
      "600 mesaj/saat, 10.000 mesaj/gün",
      "Pro'daki tüm özellikler",
      "SLA & öncelikli destek",
      "Özelleştirilebilir sistem promptu",
      "Fatura ve toplu ödeme",
      "Ekip için hazır (yakında)",
    ],
  },
];

function PricingPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const { openCheckout, loading } = usePaddleCheckout();
  const { tier } = useSubscription(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      setEmail(data.user?.email ?? undefined);
    });
  }, []);

  async function handleSelect(plan: (typeof PLANS)[number]) {
    if (plan.id === "free") {
      toast.info("Ücretsiz planı zaten kullanıyorsunuz.");
      return;
    }
    if (!userId) {
      window.location.href = `/auth?next=${encodeURIComponent("/fiyatlar")}`;
      return;
    }
    const priceId = cycle === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
    if (!priceId) return;
    try {
      await openCheckout({ priceId, customerEmail: email, userId });
    } catch (e) {
      toast.error((e as Error).message || "Ödeme başlatılamadı");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PaymentTestModeBanner />
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>
          <h1 className="ml-auto font-serif text-lg">Fiyatlandırma</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl md:text-5xl mb-3">Size uygun planı seçin</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            İptal kolay. KDV dahildir. Ödemeler güvenli olarak Paddle üzerinden alınır (fatura
            Paddle adına düzenlenir).
          </p>

          <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-lg border border-border bg-card">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-1.5 rounded-md text-sm ${cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Aylık
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-4 py-1.5 rounded-md text-sm ${cycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Yıllık <span className="ml-1 text-xs opacity-80">2 ay bedava</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const price = cycle === "monthly" ? p.monthly : p.yearly;
            const isCurrent = tier === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-6 flex flex-col ${
                  p.highlight ? "border-primary shadow-lg bg-card" : "border-border bg-card/50"
                }`}
              >
                {p.highlight && (
                  <div className="text-xs uppercase tracking-wide text-primary font-medium mb-2">
                    En Popüler
                  </div>
                )}
                <h3 className="font-serif text-2xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{p.tagline}</p>
                <div className="mb-5">
                  <span className="text-4xl font-serif">{price.toLocaleString("tr-TR")} ₺</span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{cycle === "monthly" ? "ay" : "yıl"}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.highlight ? "default" : "outline"}
                  disabled={loading || isCurrent}
                  onClick={() => handleSelect(p)}
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isCurrent ? "Mevcut Plan" : p.id === "free" ? "Ücretsiz Başla" : "Planı Seç"}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 max-w-3xl mx-auto">
          Hukuk Asistanı bir yazılım aracıdır ve hukuki tavsiye yerine geçmez. Kullanım
          şartları için{" "}
          <Link to="/kullanim-sartlari" className="underline">
            buraya
          </Link>{" "}
          bakınız.
        </p>
      </main>
    </div>
  );
}
