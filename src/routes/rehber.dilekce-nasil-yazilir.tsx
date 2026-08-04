import { createFileRoute, Link } from "@tanstack/react-router";

const dl = (name: string, ext: "pdf" | "docx") => `/api/public/dilekce/${name}.${ext}`;

const SAMPLES = [
  {
    title: "İş Davası Dilekçesi",
    desc: "Kıdem, ihbar ve yıllık izin alacaklarının tahsili için iş mahkemesine sunulacak örnek dava dilekçesi.",
    name: "is-davasi-dilekcesi",
    pdf: dl("is-davasi-dilekcesi", "pdf"),
    docx: dl("is-davasi-dilekcesi", "docx"),
  },
  {
    title: "İcra Takibine İtiraz Dilekçesi",
    desc: "Ödeme emrine borca, faize, imzaya ve yetkiye itirazları içeren örnek dilekçe (İİK m.62).",
    name: "icra-itiraz-dilekcesi",
    pdf: dl("icra-itiraz-dilekcesi", "pdf"),
    docx: dl("icra-itiraz-dilekcesi", "docx"),
  },
  {
    title: "Bilgi Edinme Başvuru Dilekçesi",
    desc: "4982 s. Kanun kapsamında kamu kurumuna yapılacak bilgi/belge talebi için örnek başvuru.",
    name: "bilgi-edinme-dilekcesi",
    pdf: dl("bilgi-edinme-dilekcesi", "pdf"),
    docx: dl("bilgi-edinme-dilekcesi", "docx"),
  },
];

const CANONICAL = "https://hukuk-asistani-eta.vercel.app/rehber/dilekce-nasil-yazilir";

export const Route = createFileRoute("/rehber/dilekce-nasil-yazilir")({
  head: () => ({
    meta: [
      { title: "Dilekçe Nasıl Yazılır? Örnek ve Adım Adım Rehber — Hukuk Asistanı" },
      {
        name: "description",
        content:
          "Dilekçe nasıl yazılır? Başlık, hitap, konu, açıklama, talep, imza ve ekler dahil dilekçenin tüm bölümleri, biçim kuralları ve örneklerle adım adım hukuki rehber.",
      },
      {
        name: "keywords",
        content:
          "dilekçe nasıl yazılır, dilekçe örneği, dilekçe formatı, dilekçe yazma kuralları, resmi dilekçe, mahkemeye dilekçe",
      },
      { property: "og:title", content: "Dilekçe Nasıl Yazılır? Adım Adım Rehber" },
      {
        property: "og:description",
        content:
          "Türkiye'de resmi kurumlara ve mahkemelere dilekçe yazımının tüm kuralları: yapı, üslup, ekler ve hazır örnek şablonlar.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dilekçe Nasıl Yazılır? Adım Adım Rehber" },
      {
        name: "twitter:description",
        content:
          "Dilekçenin bölümleri, biçim kuralları, örnekler ve hazır şablonlar — pratik hukuki rehber.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Dilekçe Nasıl Yazılır? Adım Adım Rehber",
          description:
            "Türkiye'de dilekçe yazımının bölümleri, biçim kuralları ve örnekleriyle kapsamlı rehber.",
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
              name: "Dilekçe nasıl başlar?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Dilekçe, sağ üst köşede tarih ve sol üstte muhatap makamın (örn. 'İSTANBUL 3. ASLİYE HUKUK MAHKEMESİ HAKİMLİĞİ'NE') büyük harflerle yazılmasıyla başlar. Ardından davacı/başvurucu bilgileri, konu ve açıklamalar bölümü gelir.",
              },
            },
            {
              "@type": "Question",
              name: "Dilekçede hangi bilgiler bulunmalıdır?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Muhatap makam, başvurucunun ad-soyad ve T.C. kimlik numarası, adres, konu, açıklamalar (olayın anlatımı ve hukuki dayanaklar), sonuç ve talep, tarih, imza ve varsa ekler dilekçede bulunması gereken temel unsurlardır.",
              },
            },
            {
              "@type": "Question",
              name: "Dilekçe elle mi yazılmalı, bilgisayarla mı?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Her iki biçim de geçerlidir. Ancak resmi kurum ve mahkemelere sunulacak dilekçelerin okunaklı olması ve arşivlemeye uygun olması için A4 kağıda bilgisayarla yazılması tercih edilir. El yazısıyla yazıldığında mavi tükenmez kalem ve okunaklı yazı kullanılmalıdır.",
              },
            },
            {
              "@type": "Question",
              name: "Dilekçe kaç sayfa olmalıdır?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Kesin bir sayfa sınırı yoktur. Konuya göre 1-2 sayfa yeterli olabileceği gibi karmaşık davalarda 10+ sayfayı bulabilir. Önemli olan olayın, hukuki dayanakların ve talebin açık ve gereksiz tekrarlardan uzak biçimde ifade edilmesidir.",
              },
            },
            {
              "@type": "Question",
              name: "Dilekçe hangi dilde yazılır?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Türkiye'deki tüm resmi başvurular ve mahkeme dilekçeleri HMK m.202 ve Anayasa m.3 uyarınca Türkçe yazılır. Yabancı dildeki belgelerin yeminli tercüman tarafından tercüme edilerek eklenmesi gerekir.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: DilekceGuidePage,
});

function DilekceGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-foreground">
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          Anasayfa
        </Link>{" "}
        / <span aria-current="page">Dilekçe Nasıl Yazılır?</span>
      </nav>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Dilekçe Nasıl Yazılır? Adım Adım Rehber ve Örnek</h1>

        <p className="lead">
          Dilekçe; kişilerin bir talep, şikâyet, itiraz ya da bilgi verme amacıyla resmi kurumlara,
          mahkemelere ya da özel kuruluşlara yazılı olarak başvurmasını sağlayan hukuki bir
          belgedir. Anayasa m.74 uyarınca dilekçe hakkı temel bir haktır ve herkes vatandaşlıkla
          ilgili işlerde yetkili makamlara yazılı başvuruda bulunabilir. Bu rehber, hukuka uygun ve
          etkili bir dilekçenin nasıl hazırlanacağını adım adım anlatır.
        </p>

        <p>
          Aceleniz varsa, hazır şablonlar için doğrudan{" "}
          <Link to="/sablonlar" className="underline font-medium">
            Şablonlar sayfasına
          </Link>{" "}
          göz atabilir; kişiselleştirilmiş bir dilekçe için yapay zekâ hukuki asistanımızla{" "}
          <Link to="/" className="underline font-medium">
            yeni bir dosya
          </Link>{" "}
          başlatabilirsiniz.
        </p>

        <h2>Hazır Örnek Dilekçeler (PDF / DOCX)</h2>
        <p>
          Aşağıdaki örnek dilekçeleri doğrudan indirip kendi bilgilerinize göre düzenleyebilirsiniz.
          Dosyalar Türk hukuk mevzuatına uygun standart yapıda hazırlanmıştır; somut olayınıza
          uyarlarken avukat desteği almanız önerilir.
        </p>
        <ul className="not-prose grid gap-3 my-4">
          {SAMPLES.map((s) => (
            <li
              key={s.name}
              className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div>
                <div className="font-medium text-foreground">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={s.pdf}
                  download={`${s.name}.pdf`}
                  className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  PDF indir
                </a>
                <a
                  href={s.docx}
                  download={`${s.name}.docx`}
                  className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  DOCX indir
                </a>
              </div>
            </li>
          ))}
        </ul>

        <h2>Dilekçenin Bölümleri</h2>
        <p>
          Standart bir dilekçe aşağıdaki bölümlerden oluşur. Bu yapı, hem resmi kurumlara yazılan
          idari dilekçelerde hem de mahkemeye sunulan dava, cevap, ıslah ve itiraz dilekçelerinde
          büyük ölçüde aynıdır.
        </p>

        <h3>1. Muhatap Makam (Başlık)</h3>
        <p>
          Dilekçe, muhatap kurumun adının büyük harflerle ve ortalanmış olarak yazılmasıyla başlar.
          Mahkemelere hitap edilirken makam adının sonuna vurguyu belirtmek için üç noktalı kesme
          işareti kullanılır:
        </p>
        <blockquote>
          <p>ANKARA 5. ASLİYE HUKUK MAHKEMESİ HAKİMLİĞİ'NE</p>
          <p>&nbsp;</p>
          <p>İSTANBUL CUMHURİYET BAŞSAVCILIĞI'NA</p>
        </blockquote>
        <p>
          Başka bir şehirde açılacak davalarda "GÖNDERİLMEK ÜZERE" ifadesi eklenir: örneğin{" "}
          <em>
            "İZMİR NÖBETÇİ ASLİYE HUKUK MAHKEMESİ'NE GÖNDERİLMEK ÜZERE ANKARA NÖBETÇİ ASLİYE HUKUK
            MAHKEMESİ'NE"
          </em>
          .
        </p>

        <h3>2. Tarafların Bilgileri</h3>
        <p>Muhatap makamın altında, başvurucunun kimlik ve iletişim bilgileri yer alır:</p>
        <ul>
          <li>
            <strong>Davacı / Başvurucu:</strong> Ad-soyad, T.C. kimlik numarası, açık adres, telefon
            ve e-posta.
          </li>
          <li>
            <strong>Vekili (varsa):</strong> Av. Ad-Soyad, baro sicil numarası, büro adresi.
          </li>
          <li>
            <strong>Davalı / Karşı Taraf:</strong> Bilinen ad-soyad ve adres bilgileri; bilinmiyorsa
            "adresi meçhul" ibaresi.
          </li>
        </ul>

        <h3>3. Konu</h3>
        <p>
          Dilekçenin özünün tek cümlelik özeti. Mahkeme personelinin dosya yönlendirmesini
          kolaylaştırır.
        </p>
        <blockquote>
          <p>
            <strong>KONU:</strong> Fazlaya ilişkin haklarımız saklı kalmak kaydıyla 50.000 TL
            işçilik alacağının davalıdan tahsili talebinden ibarettir.
          </p>
        </blockquote>

        <h3>4. Açıklamalar</h3>
        <p>
          Olayın kronolojik anlatımı ve hukuki dayanakların ortaya konulduğu asıl bölümdür. Her bir
          maddi vakıa numaralandırılarak yazılır; ilgili yasal düzenlemelere (kanun maddesi,
          içtihat) atıf yapılır:
        </p>
        <ol>
          <li>
            Müvekkil, davalı işverenin bünyesinde 01.01.2020 – 15.05.2024 tarihleri arasında
            kesintisiz olarak çalışmıştır.
          </li>
          <li>
            İş sözleşmesi, işverence haklı bir neden gösterilmeksizin feshedilmiş; bu durum 4857 s.
            İş Kanunu m.17'ye açıkça aykırıdır.
          </li>
          <li>Fesih sonrası hak edilen kıdem, ihbar ve yıllık izin alacakları ödenmemiştir.</li>
        </ol>

        <h3>5. Hukuki Deliller</h3>
        <p>
          HMK m.194 gereği somutlaştırma yükü kapsamında delillerin açıkça sıralanması gerekir: SGK
          hizmet dökümü, banka hesap ekstresi, tanık beyanları, bilirkişi incelemesi, yemin ve her
          türlü yasal delil.
        </p>

        <h3>6. Hukuki Sebepler</h3>
        <p>
          İlgili mevzuat listelenir: 4857 s. İş Kanunu, 6098 s. TBK, 6100 s. HMK ve diğer sair
          mevzuat.
        </p>

        <h3>7. Sonuç ve Talep</h3>
        <p>
          Mahkemeden veya kurumdan tam olarak neyin istendiği maddeler halinde net biçimde ifade
          edilir. Bu bölüm dilekçenin en kritik kısmıdır; talep edilmeyen hakkında karar verilemez
          (HMK m.26 – taleple bağlılık ilkesi).
        </p>
        <blockquote>
          <p>
            <strong>SONUÇ VE İSTEM:</strong> Yukarıda arz ve izah edilen nedenlerle;
          </p>
          <ol>
            <li>Davamızın kabulüne,</li>
            <li>
              Fazlaya ilişkin haklarımız saklı kalmak kaydıyla şimdilik 50.000 TL alacağın fesih
              tarihinden itibaren işleyecek en yüksek banka mevduat faiziyle birlikte davalıdan
              tahsiline,
            </li>
            <li>Yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine,</li>
          </ol>
          <p>karar verilmesini saygılarımla arz ve talep ederim.</p>
        </blockquote>

        <h3>8. Tarih ve İmza</h3>
        <p>
          Sağ altta tarih ve ıslak imza; sol altta "Davacı / Başvurucu" ya da "Davacı Vekili"
          ibaresi yer alır. Elektronik ortamda (UYAP, e-Devlet) sunulan dilekçelerde e-imza
          yeterlidir.
        </p>

        <h3>9. Ekler</h3>
        <p>Dilekçeye eklenen tüm belgeler numaralandırılarak listelenir:</p>
        <ul>
          <li>EK-1: Nüfus cüzdanı fotokopisi</li>
          <li>EK-2: İş sözleşmesi</li>
          <li>EK-3: SGK hizmet dökümü</li>
          <li>EK-4: Vekaletname (varsa)</li>
        </ul>

        <h2>Biçim ve Üslup Kuralları</h2>
        <ul>
          <li>
            <strong>Kağıt ve yazı tipi:</strong> A4 kağıt, Times New Roman 12 pt veya Arial 11 pt,
            1,15-1,5 satır aralığı.
          </li>
          <li>
            <strong>Kenar boşlukları:</strong> Sol 3 cm, sağ 2 cm, üst-alt 2,5 cm.
          </li>
          <li>
            <strong>Dil:</strong> Türkçe, resmi ve saygılı üslup. Argo, hakaret veya kişisel yorum
            içeren ifadelerden kaçınılmalıdır.
          </li>
          <li>
            <strong>Yazım kuralları:</strong> Kısaltmalar açık yazılır; sayılar hem rakam hem
            yazıyla belirtilebilir (örn. 50.000 TL / Elli bin TL).
          </li>
          <li>
            <strong>Nüsha sayısı:</strong> Fiziksel başvurularda karşı taraf sayısı + 1 nüsha
            hazırlanır.
          </li>
        </ul>

        <h2>Sık Yapılan Hatalar</h2>
        <ul>
          <li>Muhatap makamın yanlış yazılması (görevsiz/yetkisiz mahkeme).</li>
          <li>T.C. kimlik numarasının belirtilmemesi.</li>
          <li>Talep bölümünde faiz türü ve başlangıç tarihinin belirtilmemesi.</li>
          <li>Hukuki dayanağın gösterilmemesi.</li>
          <li>Duygusal/hakaret içeren ifadeler kullanılması.</li>
          <li>Ekler listesinin eksik verilmesi.</li>
        </ul>

        <h2>Dilekçe Türleri</h2>
        <p>
          Amaca göre çok sayıda dilekçe türü bulunur. En sık karşılaşılanlar için hazır
          şablonlarımızı{" "}
          <Link to="/sablonlar" className="underline font-medium">
            Şablonlar sayfasında
          </Link>{" "}
          bulabilirsiniz:
        </p>
        <ul>
          <li>Dava dilekçesi (asliye hukuk, iş, tüketici, aile mahkemeleri)</li>
          <li>Cevap dilekçesi</li>
          <li>İcra takibine itiraz dilekçesi</li>
          <li>Şikayet dilekçesi (Cumhuriyet Başsavcılığı)</li>
          <li>Kamu kurumlarına başvuru ve bilgi edinme dilekçesi</li>
          <li>İstinaf ve temyiz dilekçesi</li>
        </ul>

        <h2>Yapay Zekâ ile Dilekçe Hazırlama</h2>
        <p>
          Hukuk Asistanı, dilekçenizin taslağını Türk hukuk mevzuatına uygun biçimde
          hazırlamanıza yardımcı olur. Olayınızı anlatın; uygun kanun maddeleri, içtihat atıfları ve
          talep sonuçlarıyla birlikte bir taslak alın.{" "}
          <Link to="/" className="underline font-medium">
            Yeni bir dosya başlatın
          </Link>{" "}
          veya hazır kalıplar için{" "}
          <Link to="/sablonlar" className="underline font-medium">
            Şablonlar sayfasını
          </Link>{" "}
          ziyaret edin.
        </p>

        <p className="text-sm text-muted-foreground mt-8">
          <em>
            Not: Bu içerik genel bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz. Somut
            olayınıza ilişkin hukuki destek için bir avukata danışmanız önerilir.
          </em>
        </p>
      </article>
    </main>
  );
}
