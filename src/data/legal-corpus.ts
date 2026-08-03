// Curated core Turkish legal corpus for RAG seed.
// Concise official summaries per article — enough context for retrieval snippets
// without shipping full text. Admin can extend via SQL later.

export type LegalSeedEntry = {
  kind: "kanun"; // future: "yonetmelik" | "ictihat"
  code: string; // Anayasa, TMK, TBK, TCK, HMK, CMK, İİK, İş K., TTK
  article_no: string; // "m.10" formatted
  title: string;
  content: string;
  ref: string; // canonical citation
};

export const LEGAL_CORPUS: LegalSeedEntry[] = [
  // ── Anayasa
  {
    kind: "kanun",
    code: "Anayasa",
    article_no: "m.2",
    title: "Cumhuriyetin nitelikleri",
    content:
      "Türkiye Cumhuriyeti, toplumun huzuru, milli dayanışma ve adalet anlayışı içinde, insan haklarına saygılı, Atatürk milliyetçiliğine bağlı, başlangıçta belirtilen temel ilkelere dayanan, demokratik, laik ve sosyal bir hukuk Devletidir.",
    ref: "1982 Anayasası m.2",
  },
  {
    kind: "kanun",
    code: "Anayasa",
    article_no: "m.10",
    title: "Kanun önünde eşitlik",
    content:
      "Herkes, dil, ırk, renk, cinsiyet, siyasi düşünce, felsefi inanç, din, mezhep ve benzeri sebeplerle ayırım gözetilmeksizin kanun önünde eşittir. Devlet organları ve idare bütün işlemlerinde kanun önünde eşitlik ilkesine uygun hareket etmek zorundadır.",
    ref: "1982 Anayasası m.10",
  },
  {
    kind: "kanun",
    code: "Anayasa",
    article_no: "m.17",
    title: "Kişinin dokunulmazlığı, maddi ve manevi varlığı",
    content:
      "Herkes yaşama, maddi ve manevi varlığını koruma ve geliştirme hakkına sahiptir. Tıbbi zorunluluklar ve kanunda yazılı haller dışında, kişinin vücut bütünlüğüne dokunulamaz; rızası olmadan bilimsel ve tıbbi deneylere tabi tutulamaz.",
    ref: "1982 Anayasası m.17",
  },
  {
    kind: "kanun",
    code: "Anayasa",
    article_no: "m.20",
    title: "Özel hayatın gizliliği",
    content:
      "Herkes, özel hayatına ve aile hayatına saygı gösterilmesini isteme hakkına sahiptir. Özel hayatın ve aile hayatının gizliliğine dokunulamaz. Herkes, kendisiyle ilgili kişisel verilerin korunmasını isteme hakkına sahiptir.",
    ref: "1982 Anayasası m.20",
  },
  {
    kind: "kanun",
    code: "Anayasa",
    article_no: "m.36",
    title: "Hak arama hürriyeti",
    content:
      "Herkes, meşru vasıta ve yollardan faydalanmak suretiyle yargı mercileri önünde davacı veya davalı olarak iddia ve savunma ile adil yargılanma hakkına sahiptir. Hiçbir mahkeme, görev ve yetkisi içindeki davaya bakmaktan kaçınamaz.",
    ref: "1982 Anayasası m.36",
  },
  {
    kind: "kanun",
    code: "Anayasa",
    article_no: "m.38",
    title: "Suç ve cezalara ilişkin esaslar",
    content:
      "Kimse, işlendiği zaman yürürlükte bulunan kanunun suç saymadığı bir fiilden dolayı cezalandırılamaz. Suçluluğu hükmen sabit oluncaya kadar kimse suçlu sayılamaz. Kanuna aykırı elde edilmiş bulgular delil olarak kabul edilemez.",
    ref: "1982 Anayasası m.38",
  },

  // ── TMK (4721)
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.2",
    title: "Dürüstlük kuralı",
    content:
      "Herkes, haklarını kullanırken ve borçlarını yerine getirirken dürüstlük kurallarına uymak zorundadır. Bir hakkın açıkça kötüye kullanılmasını hukuk düzeni korumaz.",
    ref: "4721 sayılı TMK m.2",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.6",
    title: "İspat yükü",
    content:
      "Kanunda aksine bir hüküm bulunmadıkça, taraflardan her biri hakkını dayandırdığı olguların varlığını ispatla yükümlüdür.",
    ref: "4721 sayılı TMK m.6",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.166",
    title: "Evlilik birliğinin sarsılması (çekişmeli boşanma)",
    content:
      "Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir. Evlilik en az bir yıl sürmüş ise, eşlerin birlikte başvurması ya da bir eşin diğerinin davasını kabul etmesi hâlinde, evlilik birliği temelinden sarsılmış sayılır (anlaşmalı boşanma).",
    ref: "4721 sayılı TMK m.166",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.174",
    title: "Maddi ve manevi tazminat (boşanmada)",
    content:
      "Mevcut veya beklenen menfaatleri boşanma yüzünden zedelenen kusursuz veya daha az kusurlu taraf, kusurlu taraftan uygun bir maddi tazminat isteyebilir. Boşanmaya sebep olan olaylar yüzünden kişilik hakkı saldırıya uğrayan taraf, kusurlu olan diğer taraftan manevi tazminat olarak uygun miktarda bir para ödenmesini isteyebilir.",
    ref: "4721 sayılı TMK m.174",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.175",
    title: "Yoksulluk nafakası",
    content:
      "Boşanma yüzünden yoksulluğa düşecek taraf, kusuru daha ağır olmamak koşuluyla geçimi için diğer taraftan mali gücü oranında süresiz olarak nafaka isteyebilir.",
    ref: "4721 sayılı TMK m.175",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.182",
    title: "Velayet, çocukla kişisel ilişki ve iştirak nafakası",
    content:
      "Boşanma veya ayrılığa karar verilirken, olanak bulundukça ana ve baba dinlenerek, velayetin kullanılması kendisine verilmeyen eşin çocuk ile kişisel ilişkisi düzenlenir. Velayetin kullanılması kendisine verilmeyen eş, çocuğun bakım ve eğitim giderlerine gücü oranında katılmak zorundadır.",
    ref: "4721 sayılı TMK m.182",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.202",
    title: "Yasal mal rejimi — edinilmiş mallara katılma",
    content:
      "Eşler arasında edinilmiş mallara katılma rejiminin uygulanması asıldır. Eşler, mal rejimi sözleşmesiyle kanunda belirlenen diğer rejimlerden birini kabul edebilirler.",
    ref: "4721 sayılı TMK m.202",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.495",
    title: "Yasal mirasçılar — altsoy",
    content:
      "Miras bırakanın birinci derece mirasçıları, onun altsoyudur. Çocuklar eşit olarak mirasçıdırlar. Miras bırakandan önce ölmüş olan çocukların yerini, her derecede halefiyet yoluyla kendi altsoyları alır.",
    ref: "4721 sayılı TMK m.495",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.499",
    title: "Sağ kalan eşin miras payı",
    content:
      "Sağ kalan eş, altsoy ile birlikte mirasçı olursa mirasın dörtte biri; ana-baba zümresi ile birlikte mirasçı olursa yarısı; büyük ana ve büyük babalar zümresi ile birlikte mirasçı olursa dörtte üçü kendisine aittir. Bunlar yoksa mirasın tamamı eşe kalır.",
    ref: "4721 sayılı TMK m.499",
  },
  {
    kind: "kanun",
    code: "TMK",
    article_no: "m.605",
    title: "Mirasın reddi",
    content:
      "Yasal ve atanmış mirasçılar mirası reddedebilirler. Ölümü tarihinde miras bırakanın ödemeden aczi açıkça belli veya resmen tespit edilmiş ise, miras reddedilmiş sayılır. Ret süresi üç aydır.",
    ref: "4721 sayılı TMK m.605-606",
  },

  // ── TBK (6098)
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.19",
    title: "Sözleşmelerin yorumu — muvazaa",
    content:
      "Bir sözleşmenin türünün ve içeriğinin belirlenmesinde ve yorumlanmasında, tarafların yanlışlıkla veya gerçek amaçlarını gizlemek için kullandıkları sözcüklere bakılmaksızın, gerçek ve ortak iradeleri esas alınır.",
    ref: "6098 sayılı TBK m.19",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.27",
    title: "Kesin hükümsüzlük",
    content:
      "Kanunun emredici hükümlerine, ahlaka, kamu düzenine, kişilik haklarına aykırı veya konusu imkânsız olan sözleşmeler kesin olarak hükümsüzdür.",
    ref: "6098 sayılı TBK m.27",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.49",
    title: "Haksız fiil sorumluluğu",
    content:
      "Kusurlu ve hukuka aykırı bir fiille başkasına zarar veren, bu zararı gidermekle yükümlüdür. Zarar verici fiili yasaklayan bir hukuk kuralı bulunmasa bile, ahlaka aykırı bir fiille başkasına kasten zarar veren de bu zararı gidermekle yükümlüdür.",
    ref: "6098 sayılı TBK m.49",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.146",
    title: "Zamanaşımı — on yıl",
    content: "Kanunda aksine bir hüküm bulunmadıkça, her alacak on yıllık zamanaşımına tabidir.",
    ref: "6098 sayılı TBK m.146",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.147",
    title: "Beş yıllık zamanaşımı",
    content:
      "Kira bedelleri, anapara faizleri, ücretler, evlere ait alacaklar ve serbest meslek erbabının ücret alacakları, taşınır satımından doğan alacaklar beş yıllık zamanaşımına tabidir.",
    ref: "6098 sayılı TBK m.147",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.299",
    title: "Kira sözleşmesi — genel tanım",
    content:
      "Kira sözleşmesi, kiraya verenin bir şeyin kullanılmasını veya kullanmayla birlikte ondan yararlanılmasını kiracıya bırakmayı, kiracının da buna karşılık kararlaştırılan kira bedelini ödemeyi üstlendiği sözleşmedir.",
    ref: "6098 sayılı TBK m.299",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.343",
    title: "Konut ve çatılı işyeri — kira artışı sınırı",
    content:
      "Kira sözleşmelerinde kira bedelinin belirlenmesi dışında, kiracı aleyhine değişiklik yapılamaz. Yenilenen kira dönemlerinde uygulanacak kira bedelindeki artış, bir önceki kira yılında tüketici fiyat endeksindeki on iki aylık ortalamayı geçemez.",
    ref: "6098 sayılı TBK m.343-344",
  },
  {
    kind: "kanun",
    code: "TBK",
    article_no: "m.350",
    title: "Kiraya verenden kaynaklı tahliye — konut ihtiyacı",
    content:
      "Kiraya veren, kira sözleşmesini; kiralananı kendisi, eşi, altsoyu, üstsoyu veya bakmakla yükümlü olduğu diğer kişiler için konut ya da işyeri gereksinimi sebebiyle kullanma zorunluluğu varsa belirli süreli sözleşmelerde sürenin sonunda, belirsiz süreli sözleşmelerde kiraya ilişkin fesih dönemine uyularak dava yoluyla sona erdirebilir.",
    ref: "6098 sayılı TBK m.350",
  },

  // ── TCK (5237)
  {
    kind: "kanun",
    code: "TCK",
    article_no: "m.86",
    title: "Kasten yaralama",
    content:
      "Kasten başkasının vücuduna acı veren veya sağlığının ya da algılama yeteneğinin bozulmasına neden olan kişi, bir yıldan üç yıla kadar hapis cezası ile cezalandırılır. Basit tıbbi müdahaleyle giderilebilecek yaralamalarda cezanın alt sınırı dört ay, üst sınırı bir yıldır.",
    ref: "5237 sayılı TCK m.86",
  },
  {
    kind: "kanun",
    code: "TCK",
    article_no: "m.106",
    title: "Tehdit",
    content:
      "Bir başkasını, kendisinin veya yakınının hayatına, vücut veya cinsel dokunulmazlığına yönelik bir saldırı gerçekleştireceğinden bahisle tehdit eden kişi, altı aydan iki yıla kadar hapis cezası ile cezalandırılır.",
    ref: "5237 sayılı TCK m.106",
  },
  {
    kind: "kanun",
    code: "TCK",
    article_no: "m.125",
    title: "Hakaret",
    content:
      "Bir kimseye onur, şeref ve saygınlığını rencide edebilecek nitelikte somut bir fiil veya olgu isnat eden veya sövmek suretiyle bir kimsenin onur, şeref ve saygınlığına saldıran kişi, üç aydan iki yıla kadar hapis veya adli para cezası ile cezalandırılır.",
    ref: "5237 sayılı TCK m.125",
  },
  {
    kind: "kanun",
    code: "TCK",
    article_no: "m.155",
    title: "Güveni kötüye kullanma",
    content:
      "Başkasına ait olup da, muhafaza etmek veya belirli bir şekilde kullanmak üzere zilyetliği kendisine devredilmiş olan mal üzerinde, kendisinin veya başkasının yararına olarak, zilyetliğin devri amacı dışında tasarrufta bulunan veya bu devir olgusunu inkâr eden kişi, altı aydan iki yıla kadar hapis ve adli para cezası ile cezalandırılır.",
    ref: "5237 sayılı TCK m.155",
  },
  {
    kind: "kanun",
    code: "TCK",
    article_no: "m.157",
    title: "Dolandırıcılık",
    content:
      "Hileli davranışlarla bir kimseyi aldatıp, onun veya başkasının zararına olarak, kendisine veya başkasına yarar sağlayan kişiye bir yıldan beş yıla kadar hapis ve beş bin güne kadar adli para cezası verilir.",
    ref: "5237 sayılı TCK m.157",
  },
  {
    kind: "kanun",
    code: "TCK",
    article_no: "m.66",
    title: "Dava zamanaşımı süreleri",
    content:
      "Kanunda başka türlü yazılmış olan haller dışında kamu davası; ağırlaştırılmış müebbet hapiste 30 yıl, müebbet hapiste 25 yıl, 20 yıldan aşağı olmamak üzere hapis cezasında 20 yıl, 5 yıldan fazla ve 20 yıldan az hapis cezasında 15 yıl, 5 yıldan fazla olmayan hapis veya adli para cezasında 8 yıl geçmesiyle düşer.",
    ref: "5237 sayılı TCK m.66",
  },

  // ── İİK (2004)
  {
    kind: "kanun",
    code: "İİK",
    article_no: "m.16",
    title: "İcra dairesinin işlemlerine karşı şikayet",
    content:
      "Kanunun hallini mahkemeye bıraktığı hususlar müstesna olmak üzere icra ve iflas dairelerinin yaptığı muameleler hakkında, kanuna muhalif olmasından veya hadiseye uygun bulunmamasından dolayı icra mahkemesine şikayet olunabilir. Şikayet, muameleden veya haberdar olmadan itibaren yedi gün içinde yapılır.",
    ref: "2004 sayılı İİK m.16",
  },
  {
    kind: "kanun",
    code: "İİK",
    article_no: "m.62",
    title: "İtirazın şekli — ödeme emrine itiraz",
    content:
      "İtiraz etmek isteyen borçlu, itirazını ödeme emrinin kendisine tebliğinden itibaren yedi gün içinde dilekçe ile veya sözlü olarak icra dairesine bildirmeye mecburdur.",
    ref: "2004 sayılı İİK m.62",
  },
  {
    kind: "kanun",
    code: "İİK",
    article_no: "m.83",
    title: "Kısmen haczi caiz olan maaşlar",
    content:
      "Maaşlar, tahsisat ve her nevi ücretler, intifa hakları ve hasılatı, ilama müstenit olmayan nafakalar, tekaüt maaşları, sigortalar veya tekaüt sandıkları tarafından tahsis edilen iratlar, borçlu ve ailesinin geçinmeleri için icra memurunca lüzumlu olarak takdir edilen miktar tenzil edildikten sonra haczolunabilir. Ancak haczolunacak miktar bunların dörtte birinden az olamaz.",
    ref: "2004 sayılı İİK m.83",
  },
  {
    kind: "kanun",
    code: "İİK",
    article_no: "m.89",
    title: "Üçüncü şahıslardaki mal ve alacakların haczi (haciz ihbarnamesi)",
    content:
      "Hamiline muharrer olmayan alacak veya sair bir talep hakkı borçluya ait ise, icra dairesi üçüncü şahsa bundan böyle borcunu ancak icra dairesine ödeyebileceğini ve borçluya yapılan ödemenin muteber olmadığını veya malı yalnız icra dairesine teslim edebileceğini bildirir. Bu haciz ihbarnamesidir.",
    ref: "2004 sayılı İİK m.89",
  },

  // ── HMK (6100)
  {
    kind: "kanun",
    code: "HMK",
    article_no: "m.6",
    title: "Yetki — genel yetkili mahkeme",
    content:
      "Bir davada, kanunda aksi öngörülmemiş ise davalı gerçek veya tüzel kişinin davanın açıldığı tarihteki yerleşim yeri mahkemesi yetkilidir.",
    ref: "6100 sayılı HMK m.6",
  },
  {
    kind: "kanun",
    code: "HMK",
    article_no: "m.114",
    title: "Dava şartları",
    content:
      "Dava şartları şunlardır: Türk mahkemelerinin yargı hakkının bulunması, yargı yolunun caiz olması, mahkemenin görevli olması, yetkinin kesin olduğu hallerde mahkemenin yetkili bulunması, tarafların taraf ehliyetine sahip olmaları, davacı tarafın dava açmakta hukuki yararının bulunması, aynı davanın daha önceden açılmış ve halen görülmekte olmaması, aynı davanın kesin hükme bağlanmamış olması.",
    ref: "6100 sayılı HMK m.114",
  },
  {
    kind: "kanun",
    code: "HMK",
    article_no: "m.119",
    title: "Dava dilekçesinin içeriği",
    content:
      "Dava dilekçesinde şunlar bulunur: Mahkemenin adı; davacı ile davalının adı, soyadı ve adresleri; tarafların TC kimlik numarası; varsa tarafların kanuni temsilcilerinin ve davacı vekilinin ad, soyad ve adresleri; davanın konusu ve malvarlığı haklarına ilişkin davalarda dava konusunun değeri; davacının iddiasının dayanağı olan bütün vakıaların sıra numarası altında açık özetleri; iddia edilen her bir vakıanın hangi delillerle ispat edileceği; dayanılan hukuki sebepler; açık bir şekilde talep sonucu; davacının, varsa kanuni temsilcisinin veya vekilinin imzası.",
    ref: "6100 sayılı HMK m.119",
  },
  {
    kind: "kanun",
    code: "HMK",
    article_no: "m.240",
    title: "Tanık delili",
    content:
      "Davada taraf olmayan kişiler tanık olarak gösterilebilir. Tanık gösteren taraf, tanık dinletmek istediği vakıayı ve dinlenilmesi istenen tanıkların ad ve soyadları ile tebliğe elverişli adreslerini içeren listeyi mahkemeye sunar.",
    ref: "6100 sayılı HMK m.240",
  },

  // ── CMK (5271)
  {
    kind: "kanun",
    code: "CMK",
    article_no: "m.90",
    title: "Yakalama ve yakalanan kişi hakkında yapılacak işlemler",
    content:
      "Aşağıda belirtilen hallerde herkes tarafından geçici olarak yakalama yapılabilir: kişiye suçu işlerken rastlanması veya suçüstü bir fiilden dolayı izlenen kişinin kaçması olasılığının bulunması ya da hemen kimliğini belirleme olanağının bulunmaması. Yakalanan kişi haklarında hemen bilgilendirilir.",
    ref: "5271 sayılı CMK m.90",
  },
  {
    kind: "kanun",
    code: "CMK",
    article_no: "m.100",
    title: "Tutuklama nedenleri",
    content:
      "Kuvvetli suç şüphesinin varlığını gösteren somut delillerin ve bir tutuklama nedeninin bulunması halinde, şüpheli veya sanık hakkında tutuklama kararı verilebilir. Tutuklama nedenleri: şüpheli veya sanığın kaçması, saklanması veya kaçacağı şüphesini uyandıran somut olguların varlığı; delilleri yok etme, gizleme veya değiştirme; tanık, mağdur veya başkaları üzerinde baskı yapılması.",
    ref: "5271 sayılı CMK m.100",
  },
  {
    kind: "kanun",
    code: "CMK",
    article_no: "m.147",
    title: "İfade ve sorguda hakların bildirilmesi",
    content:
      "Şüphelinin veya sanığın ifadesinin alınmasında veya sorguya çekilmesinde: kendisine yüklenen suç anlatılır, müdafi seçme hakkının bulunduğu ve onun hukuki yardımından yararlanabileceği, susma hakkına sahip olduğu, şüpheden kurtulması için somut delillerin toplanmasını isteyebileceği bildirilir.",
    ref: "5271 sayılı CMK m.147",
  },

  // ── İş K. (4857)
  {
    kind: "kanun",
    code: "İş K.",
    article_no: "m.17",
    title: "Süreli fesih (ihbar önelleri)",
    content:
      "İş sözleşmeleri: işi altı aydan az sürmüş işçi için iki hafta, altı ay-bir buçuk yıl arası dört hafta, bir buçuk-üç yıl arası altı hafta, üç yıldan fazla sürmüş işçi için sekiz hafta sonra feshedilmiş sayılır. Bildirim şartına uymayan taraf, bildirim süresine ilişkin ücret tutarında tazminat ödemek zorundadır.",
    ref: "4857 sayılı İş K. m.17",
  },
  {
    kind: "kanun",
    code: "İş K.",
    article_no: "m.18",
    title: "İş güvencesi — geçerli sebep",
    content:
      "Otuz veya daha fazla işçi çalıştıran işyerlerinde en az altı aylık kıdemi olan işçinin belirsiz süreli iş sözleşmesini fesheden işveren, işçinin yeterliliğinden veya davranışlarından ya da işletmenin, işyerinin veya işin gereklerinden kaynaklanan geçerli bir sebebe dayanmak zorundadır.",
    ref: "4857 sayılı İş K. m.18",
  },
  {
    kind: "kanun",
    code: "İş K.",
    article_no: "m.20",
    title: "Fesih bildirimine itiraz ve işe iade davası",
    content:
      "İş sözleşmesi feshedilen işçi, fesih bildiriminde sebep gösterilmediği veya gösterilen sebebin geçerli olmadığı iddiası ile fesih bildiriminin tebliği tarihinden itibaren bir ay içinde işe iade talebiyle arabulucuya başvurmak zorundadır. Arabuluculuk faaliyeti sonunda anlaşmaya varılamaması halinde, iki hafta içinde iş mahkemesinde dava açılabilir.",
    ref: "4857 sayılı İş K. m.20",
  },
  {
    kind: "kanun",
    code: "İş K.",
    article_no: "m.32",
    title: "Ücret ödeme zamanı",
    content:
      "Ücret, prim, ikramiye ve bu nitelikteki her çeşit istihkak kural olarak, Türk parası ile işyerinde veya özel olarak açılan bir banka hesabına ödenir. Ücret en geç ayda bir ödenir. İş sözleşmelerinin sona ermesinde, işçinin ücreti ile sözleşme ve kanundan doğan para ile ölçülmesi mümkün menfaatlerinin tam olarak ödenmesi zorunludur.",
    ref: "4857 sayılı İş K. m.32",
  },
  {
    kind: "kanun",
    code: "İş K.",
    article_no: "m.57",
    title: "Yıllık ücretli izin süreleri",
    content:
      "İşçilere verilecek yıllık ücretli izin süresi, hizmet süresi bir yıldan beş yıla kadar (beş yıl dahil) olanlara 14 gün; beş yıldan fazla on beş yıldan az olanlara 20 gün; on beş yıl (dahil) ve daha fazla olanlara 26 günden az olamaz. On sekiz ve daha küçük yaştaki işçilere ve elli ve daha yukarı yaştaki işçilere verilecek yıllık ücretli izin süresi 20 günden az olamaz.",
    ref: "4857 sayılı İş K. m.53,55",
  },

  // ── Tüketici (6502)
  {
    kind: "kanun",
    code: "TKHK",
    article_no: "m.11",
    title: "Ayıplı maldan doğan tüketici hakları",
    content:
      "Malın ayıplı olduğunun anlaşılması durumunda tüketici; satılanı geri vermeye hazır olduğunu bildirerek sözleşmeden dönme, satılanı alıkoyup ayıp oranında satış bedelinden indirim isteme, aşırı bir masraf gerektirmediği takdirde bütün masrafları satıcıya ait olmak üzere satılanın ücretsiz onarılmasını isteme, imkan varsa satılanın ayıpsız bir misli ile değiştirilmesini isteme haklarından birini kullanabilir.",
    ref: "6502 sayılı TKHK m.11",
  },
  {
    kind: "kanun",
    code: "TKHK",
    article_no: "m.68",
    title: "Tüketici hakem heyetlerine başvuru",
    content:
      "Değeri kanunla belirlenen parasal sınırın altında bulunan uyuşmazlıklarda tüketici hakem heyetlerine başvuru zorunludur. Tüketici hakem heyetleri, uyuşmazlık konusuna göre il veya ilçe merkezlerinde bulunur ve kararları bağlayıcıdır.",
    ref: "6502 sayılı TKHK m.68",
  },
];
