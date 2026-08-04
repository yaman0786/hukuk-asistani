import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/kvkk")({
  head: () => ({
    meta: [
      { title: "KVKK Aydınlatma Metni — Hukuk Asistanı" },
      {
        name: "description",
        content:
          "6698 sayılı KVKK kapsamında kişisel verilerinizin işlenmesi hakkında aydınlatma metni.",
      },
      { property: "og:title", content: "KVKK Aydınlatma Metni — Hukuk Asistanı" },
      {
        property: "og:description",
        content: "Kişisel verilerinizin işlenmesi ve haklarınız hakkında bilgi.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://hukuk-asistani-eta.vercel.app/kvkk" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hukuk-asistani-eta.vercel.app/kvkk" }],
  }),
  component: KvkkPage,
});

function KvkkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Ana sayfa
        </Link>
        <h1 className="font-serif text-3xl mt-4 mb-2">KVKK Aydınlatma Metni</h1>
        <p className="text-xs text-muted-foreground mb-8">
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında.
        </p>

        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="font-serif text-lg mt-6">Veri Sorumlusu</h2>
          <p>
            Uygulamayı işleten organizasyon veri sorumlusu sıfatıyla, hizmetin sunulabilmesi için
            gerekli kişisel verileri işler.
          </p>

          <h2 className="font-serif text-lg mt-6">İşlenen Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kimlik/iletişim: e-posta adresi, ad-soyad (Google ile giriş).</li>
            <li>Kullanıcı içerikleri: sohbet başlıkları ve mesaj içerikleri.</li>
            <li>
              İşlem güvenliği: giriş zamanı, IP (üçüncü taraf altyapı tarafından), rate-limit
              sayaçları.
            </li>
          </ul>

          <h2 className="font-serif text-lg mt-6">İşleme Amaçları</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hesabınızı yönetmek ve oturum açmanızı sağlamak.</li>
            <li>Yapay zekâ asistanına sorularınızı iletmek ve yanıt üretmek.</li>
            <li>Kötüye kullanımı önlemek, hizmet güvenliğini sağlamak.</li>
          </ul>

          <h2 className="font-serif text-lg mt-6">Aktarım</h2>
          <p>
            Mesaj içerikleri yanıt üretimi için yurt dışında yerleşik yapay zekâ sağlayıcısına
            (Google Gemini) aktarılır. Kimlik doğrulama ve veri saklama hizmetleri de yurt dışı
            altyapı sağlayıcıları üzerinde yürütülebilir.
          </p>

          <h2 className="font-serif text-lg mt-6">Haklarınız (KVKK md. 11)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>İşlenip işlenmediğini öğrenme, bilgi talep etme.</li>
            <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
            <li>Yurt içi/yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme.</li>
            <li>Silinmesini veya yok edilmesini isteme.</li>
            <li>Zararın giderilmesini talep etme.</li>
          </ul>

          <p className="mt-4">
            Uygulama içindeki <strong>"Verilerimi İndir"</strong> ve
            <strong> "Hesabımı Sil"</strong> araçlarını kullanarak veri erişim ve silme haklarınızı
            doğrudan işleyebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
