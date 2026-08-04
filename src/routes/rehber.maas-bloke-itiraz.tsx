import { createFileRoute, Link } from "@tanstack/react-router";

const CANONICAL = "https://hukuk-asistani-eta.vercel.app/rehber/maas-bloke-itiraz";

export const Route = createFileRoute("/rehber/maas-bloke-itiraz")({
  head: () => ({
    meta: [
      { title: "Maaş Hesabına Bloke Konulması ve İtiraz Süreci — Hukuk Asistanı" },
      {
        name: "description",
        content:
          "Maaş hesabına icra blokesi konulabilir mi, hangi banka hesabına bloke konulamaz, maaş haczi sınırı (1/4) ve icra dairesine itiraz süreci: adım adım rehber.",
      },
      {
        name: "keywords",
        content:
          "maaş hesabına bloke, maaş haczi, icra itiraz, hangi banka hesabına bloke konulamaz, 1/4 maaş haczi",
      },
      { property: "og:title", content: "Maaş Hesabına Bloke ve İtiraz Rehberi" },
      {
        property: "og:description",
        content:
          "Maaşa icra blokesi, yasal sınırlar (İİK m.83), muvafakat şartı ve itiraz dilekçesi süreci — pratik hukuki rehber.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Maaş Hesabına Bloke Konulması ve İtiraz Süreci",
          description:
            "Maaş hesabına icra blokesi, İİK kapsamında yasal sınırlar ve itiraz süreci hakkında kapsamlı rehber.",
          author: { "@type": "Organization", name: "Hukuk Asistanı" },
          publisher: {
            "@type": "Organization",
            name: "Hukuk Asistanı",
            logo: {
              "@type": "ImageObject",
              url: "https://hukuk-asistani-eta.vercel.app/apple-touch-icon.png",
            },
          },
          mainEntityOfPage: CANONICAL,
          inLanguage: "tr-TR",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Maaş hesabına bloke konulabilir mi?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "İcra ve İflas Kanunu (İİK) m.83 uyarınca maaşın ancak 1/4'üne haciz konulabilir. Borçlunun önceden yazılı muvafakati olmadıkça maaşın tamamına bloke konulması hukuka aykırıdır.",
              },
            },
            {
              "@type": "Question",
              name: "Hangi banka hesabına bloke konulamaz?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Nafaka, emekli maaşı (5510 s.K. m.93), asgari ücret tutarındaki kısım, SGK gelirleri ve bazı sosyal yardım hesapları haczedilemez veya sınırlı olarak haczedilebilir.",
              },
            },
            {
              "@type": "Question",
              name: "Maaş blokesine nasıl itiraz edilir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Blokeyi öğrendikten sonra 7 gün içinde icra dairesine şikayet yoluyla (İİK m.16) itiraz edilir. İcra Hukuk Mahkemesi'ne başvurulur; talep haczin kaldırılması ve bloke edilen tutarın iadesidir.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: MaasBlokeRehberi,
});

function MaasBlokeRehberi() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Ana sayfa
        </Link>

        <article className="prose prose-neutral dark:prose-invert mt-6 max-w-none">
          <h1 className="text-3xl font-semibold tracking-tight">
            Maaş Hesabına Bloke Konulması ve İtiraz Süreci
          </h1>
          <p className="text-sm text-muted-foreground">
            Güncel mevzuat: 2004 sayılı İcra ve İflas Kanunu (İİK) · 5510 sayılı Sosyal Sigortalar
            ve Genel Sağlık Sigortası Kanunu · Yargıtay 12. HD içtihatları
          </p>

          <h2>1. Maaş Haczi Nedir?</h2>
          <p>
            Kesinleşmiş bir icra takibi sonucunda alacaklı, borçlunun maaşına haciz koydurabilir.
            Ancak İİK m.83 uyarınca maaşın <strong>tamamı değil, en fazla 1/4'ü</strong> haczedilir.
            Kalan 3/4 borçlunun ve ailesinin geçimi için kanunen korunur. Nafaka alacakları bu
            sınırın istisnasıdır; nafakada oran farklı uygulanabilir.
          </p>

          <h2>2. Hangi Banka Hesabına Bloke Konulamaz?</h2>
          <ul>
            <li>
              <strong>Emekli maaşı (5510 s.K. m.93):</strong> Nafaka borcu hariç haczedilemez.
              Muvafakat olsa dahi sonradan bu muvafakat geri alınabilir.
            </li>
            <li>
              <strong>Asgari ücret düzeyindeki maaş kısmı:</strong> Uygulamada asgari geçim tutarı
              korunur.
            </li>
            <li>
              <strong>SGK ödenekleri, sosyal yardımlar, burslar:</strong> Kural olarak haczedilemez.
            </li>
            <li>
              <strong>İşsizlik ödeneği:</strong> 4447 s.K. kapsamında haczedilemez.
            </li>
          </ul>

          <h2>3. Muvafakat Şartı</h2>
          <p>
            Bankalar, borçlunun kredi/kredi kartı sözleşmesindeki genel muvafakate dayanarak maaşın
            tamamına bloke koyabilir. Ancak Yargıtay içtihatlarına göre bu muvafakat
            <strong> her zaman geri alınabilir</strong>. Bankaya yazılı bildirimle muvafakatin
            iptalini talep etmek, blokeyi kaldırmanın en hızlı yoludur.
          </p>

          <h2>4. Adım Adım İtiraz Süreci</h2>
          <ol>
            <li>
              <strong>Belge topla:</strong> Bloke bildirimi/dekont, maaş bordrosu, banka ekstresi,
              varsa muvafakat sözleşmesi.
            </li>
            <li>
              <strong>Bankaya yazılı başvur:</strong> Muvafakatin iptali ve blokenin kaldırılması
              için noter veya KEP ile bildirim gönder.
            </li>
            <li>
              <strong>İcra dairesine şikayet:</strong> Haczi öğrendiğin tarihten itibaren
              <strong> 7 gün içinde</strong> icra dairesine dilekçe ver (İİK m.16).
            </li>
            <li>
              <strong>İcra Hukuk Mahkemesi:</strong> Şikayet reddolursa İcra Hukuk Mahkemesi'ne
              itiraz. Talep: haczin kaldırılması + bloke edilen tutarın iadesi.
            </li>
            <li>
              <strong>Tedbir talebi:</strong> Yargılama süresince bloke devam ederse ihtiyati tedbir
              talep edilebilir.
            </li>
          </ol>

          <h2>5. Örnek Dilekçe Ana Noktaları</h2>
          <ul>
            <li>Dosya numarası ve taraflar</li>
            <li>Blokenin tarihi ve tutarı</li>
            <li>İİK m.83 ve 5510 m.93'e atıf</li>
            <li>Muvafakatin geri alındığına dair beyan</li>
            <li>Haczin kaldırılması ve iade talebi</li>
          </ul>

          <h2>6. Sık Yapılan Hatalar</h2>
          <ul>
            <li>7 günlük şikayet süresini kaçırmak</li>
            <li>Muvafakati yazılı geri almamak</li>
            <li>Bordro/ekstre delilini sunmamak</li>
            <li>Yanlış mahkemeye başvurmak (icra hukuk mahkemesi yetkili)</li>
          </ul>

          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm">
              <strong>Yapay zekâ ile dilekçenizi hazırlayın:</strong> Hukuk Asistanı ile
              dosyanızı yükleyip{" "}
              <Link to="/sablonlar" className="underline">
                hazır şablonlardan
              </Link>{" "}
              itiraz dilekçenizi dakikalar içinde oluşturabilirsiniz.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Bu içerik genel bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez. Somut
            olayınız için avukatınıza danışın.
          </p>
        </article>
      </div>
    </div>
  );
}
