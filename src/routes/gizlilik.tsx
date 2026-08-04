import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/gizlilik")({
  head: () => ({
    meta: [
      { title: "Gizlilik Politikası — Hukuk Asistanı" },
      {
        name: "description",
        content:
          "Hukuk Asistanı gizlilik politikası: toplanan veriler, işleme amaçları, saklama süreleri ve kullanıcı hakları.",
      },
      { property: "og:title", content: "Gizlilik Politikası — Hukuk Asistanı" },
      {
        property: "og:description",
        content: "Verilerinizi nasıl işliyoruz ve haklarınızı nasıl kullanabilirsiniz.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://hukuk-asistani-eta.vercel.app/gizlilik" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hukuk-asistani-eta.vercel.app/gizlilik" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Ana sayfa
        </Link>
        <h1 className="font-serif text-3xl mt-4 mb-2">Gizlilik Politikası</h1>
        <p className="text-xs text-muted-foreground mb-8">Son güncelleme: 23 Temmuz 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <p>
            Hukuk Asistanı ("Uygulama"), kullanıcıların hukuki sorularını yanıtlamak
            amacıyla yapay zekâ tabanlı bir asistan hizmeti sunar. Bu politika, Uygulama'yı
            kullandığınızda hangi verilerin toplandığını, nasıl işlendiğini ve haklarınızı açıklar.
          </p>

          <h2 className="font-serif text-lg mt-6">1. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Hesap oluşturma sırasında e-posta adresi (ve Google ile giriş kullanıldığında Google
              profil bilgileri).
            </li>
            <li>
              Uygulama içinde oluşturduğunuz dosyalar (sohbet başlıkları) ve gönderdiğiniz mesajlar.
            </li>
            <li>Kötüye kullanım tespiti amacıyla mesaj sayısı ve zaman damgaları.</li>
          </ul>

          <h2 className="font-serif text-lg mt-6">2. İşleme Amaçları</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Yapay zekâ modeline soru göndererek yanıt üretmek.</li>
            <li>Geçmiş sohbetlerinizi hesabınıza bağlı olarak saklamak ve göstermek.</li>
            <li>Hizmetin güvenliğini sağlamak, kötüye kullanımı engellemek.</li>
          </ul>

          <h2 className="font-serif text-lg mt-6">3. Aktarım</h2>
          <p>
            Mesaj içerikleri, yanıt üretilmesi için üçüncü taraf yapay zekâ sağlayıcısına (Google
            Gemini) iletilir. Bu aktarım hizmetin çalışması için zorunludur.
          </p>

          <h2 className="font-serif text-lg mt-6">4. Saklama Süresi</h2>
          <p>
            Sohbetleriniz siz hesabınızı veya ilgili dosyayı silene kadar saklanır. Hesap silme
            talebinizde tüm sohbetleriniz ve mesajlarınız geri döndürülemez biçimde silinir.
          </p>

          <h2 className="font-serif text-lg mt-6">5. Haklarınız</h2>
          <p>
            KVKK md. 11 kapsamında verilerinize erişme, düzeltme, silme ve aktarma haklarına
            sahipsiniz. Uygulama içinde "Verilerimi İndir" ve "Hesabımı Sil" araçları bu haklarınızı
            doğrudan kullanmanıza olanak tanır.
          </p>

          <h2 className="font-serif text-lg mt-6">6. İletişim</h2>
          <p>
            Sorularınız için lütfen uygulamayı işleten organizasyonun iletişim adresini kullanın.
            (İşletici bilgileri güncelleniyor.)
          </p>
        </div>
      </div>
    </div>
  );
}
