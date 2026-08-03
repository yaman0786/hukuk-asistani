import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/kullanim-sartlari")({
  head: () => ({
    meta: [
      { title: "Kullanım Şartları — Türkiye Hukuk Master AI" },
      {
        name: "description",
        content:
          "Türkiye Hukuk Master AI kullanım şartları: hizmet kapsamı, kullanıcı yükümlülükleri ve sorumluluk sınırları.",
      },
      { property: "og:title", content: "Kullanım Şartları — Türkiye Hukuk Master AI" },
      {
        property: "og:description",
        content: "Hizmetin kullanım koşulları ve sorumluluk sınırları.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://droit-navigator.lovable.app/kullanim-sartlari" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://droit-navigator.lovable.app/kullanim-sartlari" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Ana sayfa
        </Link>
        <h1 className="font-serif text-3xl mt-4 mb-2">Kullanım Şartları</h1>
        <p className="text-xs text-muted-foreground mb-8">Son güncelleme: 23 Temmuz 2026</p>

        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="font-serif text-lg mt-6">1. Hizmet Kapsamı</h2>
          <p>
            Türkiye Hukuk Master AI, kullanıcılara Türkiye hukuku ile ilgili genel bilgilendirme,
            hukuki araştırma özeti ve dilekçe/belge taslağı üretimi sağlayan bir yapay zekâ
            asistanıdır.
          </p>

          <h2 className="font-serif text-lg mt-6">2. Hukuki Danışmanlık Değildir</h2>
          <p className="border border-destructive/40 bg-destructive/5 rounded-md px-4 py-3">
            <strong>Önemli:</strong> Uygulama; avukatlık, hukuki mütalaa veya vekâlet hizmeti
            sunmaz. Verilen bilgiler bilgilendirme amaçlıdır ve somut olayınızda yetkili bir
            avukatın hukuki görüşünün yerine geçmez. Kritik hak ve süre kayıplarını önlemek için bir
            avukata başvurmanız gerekebilir.
          </p>

          <h2 className="font-serif text-lg mt-6">3. Doğruluk ve Sorumluluk</h2>
          <p>
            Yapay zekâ tarafından üretilen içerikler yanlış, eksik veya güncel olmayan bilgi
            içerebilir. Kanun maddeleri, içtihat ve tarihler resmi kaynaklardan doğrulanmalıdır.
            Uygulama; verilen bilgilere dayanılarak alınan kararlardan veya oluşacak zararlardan
            sorumlu tutulamaz.
          </p>

          <h2 className="font-serif text-lg mt-6">4. Kullanıcı Yükümlülükleri</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Hizmeti hukuka aykırı, dolandırıcılık, tehdit, taciz veya başkalarının haklarını ihlal
              edecek biçimde kullanmamak.
            </li>
            <li>Otomatik araç, script veya botlarla kötüye kullanım yapmamak.</li>
            <li>Gerçek kişilerin hassas kişisel verilerini gereksiz yere paylaşmamak.</li>
          </ul>

          <h2 className="font-serif text-lg mt-6">5. Kullanım Limitleri</h2>
          <p>
            Hizmetin adil kullanımı için saatte 20, günde 200 mesaj limiti uygulanır. Tekrarlanan
            ihlallerde hesabınız geçici olarak kısıtlanabilir.
          </p>

          <h2 className="font-serif text-lg mt-6">6. Değişiklikler</h2>
          <p>
            Bu şartlar zaman içinde güncellenebilir. Güncellemeler yayımlandığı andan itibaren
            geçerlidir.
          </p>
        </div>
      </div>
    </div>
  );
}
