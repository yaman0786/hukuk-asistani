// Yerleşik içtihat (emsal karar) ilkeleri — RAG için özet derleme.
// NOT: Uydurma esas/karar numarası kullanılmaz. Kayıtlar, ilgili dairenin
// yerleşik içtihadını özetler; kullanıcı somut karar metnini UYAP/Karar Arama
// üzerinden doğrulamalıdır.

export type CaseLawSeedEntry = {
  kind: "ictihat";
  code: string; // Daire / merci
  article_no: string; // kısa konu kodu (idempotent anahtar)
  title: string;
  content: string;
  ref: string;
};

export const CASE_LAW_CORPUS: CaseLawSeedEntry[] = [
  // ── Yargıtay 9. Hukuk Dairesi (İş Hukuku)
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-01",
    title: "Fazla mesai ispatı ve hakkaniyet indirimi",
    content:
      "Fazla çalışma iddiasını işçi ispatla yükümlüdür; yazılı belge yoksa tanık beyanı ile ispat mümkündür. Uzun süreli ve aralıksız fazla çalışma tanık beyanına dayanıyorsa, izin, rapor ve tatil dönemleri gözetilerek hesaplanan alacaktan hakkaniyet (takdiri) indirimi yapılır. İmzalı ücret bordrosunda fazla mesai tahakkuku varsa, işçi ancak yazılı delille aksini ispatlayabilir.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — 4857 s. İş K. m.41",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-02",
    title: "Feshin son çare olması (ultima ratio) ilkesi",
    content:
      "İşletmesel karara dayalı fesihte işveren, işçiyi başka bir bölümde veya boş pozisyonda değerlendirme, çalışma süresini kısaltma gibi tedbirleri tüketmeden feshe gitmemelidir. Fesih son çare olmalıdır; işletmesel kararın tutarlılık, keyfilik ve ölçülülük denetimi yapılır. Bu ilkeye uyulmadan yapılan fesih geçersizdir.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.18",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-03",
    title: "Ücretin ödenmemesi ve haklı nedenle fesih",
    content:
      "Ücretin, ödeme gününden itibaren 20 gün içinde mücbir sebep olmaksızın ödenmemesi işçiye İş K. m.24/II-e uyarınca haklı nedenle derhal fesih hakkı verir. İşçi bu halde iş sözleşmesini feshederse kıdem tazminatına hak kazanır; ihbar tazminatı talep edemez. Aynı gerekçeyle işçinin çalışmaktan kaçınması devamsızlık sayılmaz.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.24/II-e, m.34",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-04",
    title: "İşe iade davasında hak düşürücü süreler",
    content:
      "İş güvencesi kapsamındaki işçi, fesih bildiriminin tebliğinden itibaren bir ay içinde arabulucuya başvurmalı; anlaşma sağlanamazsa son tutanağın düzenlendiği tarihten itibaren iki hafta içinde işe iade davası açmalıdır. Bu süreler hak düşürücü olup mahkemece resen gözetilir. İşe iade kararı kesinleştikten sonra işçi 10 iş günü içinde işverene başvurmazsa fesih geçerli hale gelir.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.20-21",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-05",
    title: "Devamsızlık nedeniyle fesihte tutanak ve ispat",
    content:
      "İşverenin devamsızlık nedeniyle haklı fesih yapabilmesi için devamsızlığın izinsiz ve mazeretsiz olduğunu ispatlaması gerekir. Tek taraflı düzenlenen tutanaklar tek başına yeterli değildir; imzadan imtina, noter ihtarnamesi, puantaj ve tanık beyanı ile desteklenmelidir. Rapor veya kabul edilebilir mazeret varsa devamsızlık haklı fesih sebebi oluşturmaz.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.25/II-g",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-06",
    title: "Yıllık izin ücreti ve ispat yükü",
    content:
      "Yıllık ücretli iznin kullandırıldığını ispat yükü işverendedir ve ancak işçinin imzasını taşıyan izin defteri veya eşdeğer belge ile ispatlanabilir. Kullandırılmayan izin süreleri iş sözleşmesinin sona ermesinde son ücret üzerinden ücrete dönüşür. İzin ücreti alacağı fesihle muaccel olur ve genel beş yıllık zamanaşımına tabidir.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.56, m.59",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-07",
    title: "Kıdem tazminatına esas giydirilmiş ücret",
    content:
      "Kıdem tazminatı hesabında çıplak ücret değil, süreklilik arz eden yol, yemek, ikramiye, prim gibi ek menfaatlerin eklenmesiyle bulunan giydirilmiş brüt ücret esas alınır. Arızi ve süreklilik göstermeyen ödemeler dahil edilmez. Fiilen çalışılan günlerle sınırlı yol ve yemek yardımı, aylık çalışma günü sayısına göre oranlanır.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — 1475 s. K. m.14",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-08",
    title: "Mobbing iddiasında ispat standardı",
    content:
      "İşyerinde psikolojik taciz iddiasında işçinin, tacizin varlığını kuvvetle muhtemel gösteren olguları ortaya koyması yeterlidir; aksinin ispatı işverene geçer. Sistematik, süreklilik arz eden ve kişiyi işten uzaklaştırmaya yönelik davranışlar mobbing sayılır. Tespit halinde işçi manevi tazminat isteyebilir ve haklı nedenle fesih hakkını kullanabilir.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — TBK m.417",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-09",
    title: "İşyeri devrinde işçilik alacaklarından sorumluluk",
    content:
      "İşyeri devrinde iş sözleşmeleri tüm hak ve borçlarıyla devralana geçer. Devirden önce doğmuş ve devir tarihinde muaccel olan alacaklardan devreden işveren devir tarihinden itibaren iki yıl süreyle devralanla birlikte müteselsilen sorumludur. İşçinin kıdemi, devreden nezdinde geçen süreler de dâhil edilerek hesaplanır; devir tek başına haklı fesih sebebi değildir.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.6",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 9. HD",
    article_no: "is-10",
    title: "Asıl işveren – alt işveren ilişkisinde muvazaa",
    content:
      "Alt işverene, asıl işin bir bölümünün işletmenin ve işin gereği ile teknolojik nedenlerle uzmanlık gerektirmesi hali dışında verilmesi veya daha önce o işyerinde çalıştırılan kişilerin alt işveren işçisi olarak çalıştırılması muvazaa karinesidir. Muvazaanın tespiti halinde alt işveren işçileri başlangıçtan itibaren asıl işverenin işçisi sayılır ve haklarından asıl işveren sorumlu olur.",
    ref: "Yargıtay 9. HD yerleşik içtihadı — İş K. m.2/6-7",
  },

  // ── Yargıtay 4. HD / 3. HD (Haksız fiil, tazminat)
  {
    kind: "ictihat",
    code: "Yargıtay 4. HD",
    article_no: "tazminat-01",
    title: "Manevi tazminatın belirlenmesinde ölçütler",
    content:
      "Manevi tazminat zenginleşme aracı olamaz; tarafların ekonomik ve sosyal durumu, olayın gerçekleşme biçimi, kusur derecesi, meydana gelen elem ve üzüntünün ağırlığı ile paranın alım gücü birlikte değerlendirilerek hakkaniyete uygun makul bir miktar belirlenir. Belirlenen tutar ne sembolik kalmalı ne de sebepsiz zenginleşme sonucu doğurmalıdır.",
    ref: "Yargıtay 4. HD yerleşik içtihadı — TBK m.56, m.58",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 4. HD",
    article_no: "tazminat-02",
    title: "Kişilik hakkı ihlali ve internet yayınının kaldırılması",
    content:
      "Basın ve internet yayınlarında ifade özgürlüğü ile kişilik hakkı arasında denge kurulur; haberin gerçeklik, güncellik, kamu yararı ve öz-biçim dengesi ölçütlerini taşıması gerekir. Bu ölçütleri aşan yayın kişilik hakkı ihlali oluşturur; ilgili, içeriğin çıkarılmasını ve erişimin engellenmesini isteyebilir, ayrıca manevi tazminat talep edebilir.",
    ref: "Yargıtay 4. HD yerleşik içtihadı — TMK m.24-25, 5651 s. K. m.9",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 3. HD",
    article_no: "kira-01",
    title: "Kira bedelinin tespitinde beş yıl kuralı ve hakkaniyet",
    content:
      "Beş yıldan uzun süreli veya beş yıldan sonra yenilenen kira sözleşmelerinde kira bedeli, tüketici fiyat endeksindeki oniki aylık ortalamalar, kiralananın durumu ve emsal kira bedelleri gözetilerek hakkaniyete uygun biçimde yeniden tespit edilir. Endeks üst sınırı bu dönemde uygulanmaz; tespit davası her zaman açılabilir, ancak yeni dönem başından itibaren geçerli olması için dava en geç yeni dönemin başlangıcından otuz gün önce açılmalı veya kiraya veren bu süre içinde artış iradesini yazılı bildirmelidir.",
    ref: "Yargıtay 3. HD yerleşik içtihadı — TBK m.344",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 3. HD",
    article_no: "kira-02",
    title: "İhtiyaç nedeniyle tahliyede samimiyet ve zorunluluk",
    content:
      "İhtiyaç iddiasına dayalı tahliye davasında ihtiyacın gerçek, samimi ve zorunlu olduğunun ispatı kiraya verene aittir. Geçici veya sonradan vazgeçilebilir ihtiyaç tahliye sebebi sayılmaz. Tahliye kararı sonrasında haklı sebep olmaksızın kiralananın üç yıl içinde eski kiracıdan başkasına kiralanması, eski kiracı lehine tazminat sorumluluğu doğurur.",
    ref: "Yargıtay 3. HD yerleşik içtihadı — TBK m.350, m.355",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 3. HD",
    article_no: "kira-03",
    title: "İki haklı ihtar nedeniyle tahliye",
    content:
      "Kiracı, bir kira yılı içinde kira bedelini ödemediği için kendisine yazılı olarak iki haklı ihtar gönderilmesine sebep olursa, kiraya veren kira yılının bitiminden itibaren bir ay içinde tahliye davası açabilir. İhtarların ayrı aylara ilişkin olması, yazılı yapılması ve muaccel kira borcuna dayanması gerekir; ihtardan sonra yapılan ödeme ihtarı haksız kılmaz.",
    ref: "Yargıtay 3. HD yerleşik içtihadı — TBK m.352/2",
  },

  // ── Yargıtay 12. HD (İcra ve İflas)
  {
    kind: "ictihat",
    code: "Yargıtay 12. HD",
    article_no: "icra-01",
    title: "Maaş haczinde 1/4 sınırı ve muvafakat",
    content:
      "Maaş ve ücretlerin ancak dörtte biri haczedilebilir; borçlunun ve ailesinin geçimi için gerekli kısım haczedilemez. Borçlu, haciz işleminden sonra verdiği açık muvafakatle daha yüksek oranda haczi kabul edebilir; hacizden önce alınan muvafakat geçersizdir. Asgari ücret düzeyindeki maaşlarda nafaka alacakları dışında bu sınır katı biçimde uygulanır.",
    ref: "Yargıtay 12. HD yerleşik içtihadı — İİK m.83",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 12. HD",
    article_no: "icra-02",
    title: "Emekli maaşı ve banka hesabındaki maaşın haczedilemezliği",
    content:
      "Emekli aylıkları kural olarak haczedilemez; nafaka borçları ile kurumun kendi alacakları istisnadır. Maaşın bankaya yatırılmış olması niteliğini değiştirmez; hesapta maaş olarak takip edilebilen tutar haczedilemez. Haczedilmezlik şikâyeti, haczin öğrenilmesinden itibaren yedi gün içinde icra mahkemesine yapılır.",
    ref: "Yargıtay 12. HD yerleşik içtihadı — İİK m.82-83, 5510 s. K. m.93",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 12. HD",
    article_no: "icra-03",
    title: "Haline münasip evin haczedilemezliği",
    content:
      "Borçlunun haline münasip evi haczedilemez. Ev, haline münasip olanın değerinden fazla ise satılır; bedelinden haline münasip ev alabilecek miktar borçluya bırakılır. Bu değerlendirmede borçlunun sosyal ve ekonomik durumu, ailenin nüfusu ve yerel emsal konut değerleri bilirkişi marifetiyle belirlenir.",
    ref: "Yargıtay 12. HD yerleşik içtihadı — İİK m.82/12, m.'ye ek m.85",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 12. HD",
    article_no: "icra-04",
    title: "İmzaya ve borca itirazda usul",
    content:
      "İlamsız takipte ödeme emrine itiraz süresi tebliğden itibaren yedi gündür. İmzaya itirazın açıkça ve ayrıca yapılması gerekir; sadece borca itiraz edilmişse imza ikrar edilmiş sayılır. Süresinde yapılan itiraz takibi kendiliğinden durdurur; alacaklı itirazın kaldırılması veya iptali yoluna başvurabilir.",
    ref: "Yargıtay 12. HD yerleşik içtihadı — İİK m.62, m.68-68a",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 12. HD",
    article_no: "icra-05",
    title: "Usulsüz tebligat ve öğrenme tarihi",
    content:
      "Tebligat Kanunu ve Yönetmeliğine aykırı yapılan tebligat usulsüzdür; muhatap öğrenme tarihini bildirdiğinde tebliğ o tarihte yapılmış sayılır. Muhatabın adreste bulunmaması halinde araştırma yapılmadan komşuya veya muhtara yapılan tebligat geçersizdir. Şikâyet, usulsüzlüğün öğrenilmesinden itibaren yedi gün içinde icra mahkemesine yapılır.",
    ref: "Yargıtay 12. HD yerleşik içtihadı — 7201 s. K. m.21, m.32",
  },

  // ── Yargıtay 2. HD (Aile Hukuku)
  {
    kind: "ictihat",
    code: "Yargıtay 2. HD",
    article_no: "aile-01",
    title: "Evlilik birliğinin temelinden sarsılması ve kusur dengesi",
    content:
      "Boşanmaya karar verilebilmesi için ortak hayatın çekilmez hale geldiğinin ve davalının en az davacı kadar veya daha fazla kusurlu olduğunun belirlenmesi gerekir. Tam kusurlu eş boşanma davası açamaz; eşit kusur halinde tazminata hükmedilmez. Kusur belirlemesi, tazminat ve yoksulluk nafakası taleplerinin tümünü etkilediğinden gerekçede ayrıntılı gösterilmelidir.",
    ref: "Yargıtay 2. HD yerleşik içtihadı — TMK m.166",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 2. HD",
    article_no: "aile-02",
    title: "Yoksulluk nafakasının şartları ve süresi",
    content:
      "Boşanma yüzünden yoksulluğa düşecek olan ve daha ağır kusurlu olmayan eş lehine süresiz yoksulluk nafakasına hükmedilir. Nafaka miktarı, yükümlünün ödeme gücü ve alacaklının ihtiyacı ile orantılı olmalıdır. Nafaka alacaklısının yeniden evlenmesi, fiilen evliymiş gibi yaşaması veya yoksulluğunun ortadan kalkması halinde nafaka kaldırılır.",
    ref: "Yargıtay 2. HD yerleşik içtihadı — TMK m.175, m.176",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 2. HD",
    article_no: "aile-03",
    title: "Velayette çocuğun üstün yararı ve idrak çağı",
    content:
      "Velayet düzenlemesinde belirleyici ölçüt çocuğun üstün yararıdır; anne veya babanın kusuru tek başına belirleyici değildir. İdrak çağındaki (kural olarak sekiz yaş üzeri) çocuğun görüşü uzman raporuyla alınır ve değerlendirilir. Küçük yaştaki çocuk bakımından anne yanında kalma ilkesi, annenin bakım yeterliliği bulunduğu sürece gözetilir.",
    ref: "Yargıtay 2. HD yerleşik içtihadı — TMK m.182, ÇHS m.12",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 2. HD",
    article_no: "aile-04",
    title: "Katılma alacağı ve edinilmiş mallara katılma tasfiyesi",
    content:
      "Yasal mal rejiminde her eş, diğerinin edinilmiş mallarının yarısı üzerinde katılma alacağı hakkına sahiptir. Kişisel mal savunması yapan eş bunu ispatla yükümlüdür; ispatlanamayan mal edinilmiş sayılır. Değerlendirmede tasfiye anındaki sürüm değeri esas alınır ve katılma alacağı boşanma kararının kesinleşmesiyle muaccel olur.",
    ref: "Yargıtay 2. HD yerleşik içtihadı — TMK m.219, m.222, m.235",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 2. HD",
    article_no: "aile-05",
    title: "İştirak nafakasının belirlenmesi ve artırımı",
    content:
      "İştirak nafakası, çocuğun bakım, eğitim ve sağlık giderleri ile yükümlünün ekonomik gücü gözetilerek belirlenir; velayet kendisine verilmeyen eş kusursuz olsa dahi bu nafakayı öder. Değişen ihtiyaçlar ve enflasyon karşısında nafakanın artırımı istenebilir; hâkim gelecek yıllar için endeksleme öngörebilir.",
    ref: "Yargıtay 2. HD yerleşik içtihadı — TMK m.182, m.331",
  },

  // ── Yargıtay 11. / 13. HD (Ticaret, Tüketici)
  {
    kind: "ictihat",
    code: "Yargıtay 11. HD",
    article_no: "ticaret-01",
    title: "Kambiyo senedinde bedelsizlik iddiası ve ispat",
    content:
      "Kambiyo senedi mücerret borç ikrarı içerir; bedelsizlik iddiasında bulunan taraf bunu yazılı delille ispat etmelidir. Senedin tanzim tarihinden sonra doldurulduğu (beyaza imza) iddiası da yazılı delille kanıtlanır. Lehtar dışındaki iyiniyetli hamile karşı temel ilişkiden doğan def'iler ileri sürülemez.",
    ref: "Yargıtay 11. HD yerleşik içtihadı — TTK m.687, m.778",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 13. HD",
    article_no: "tuketici-01",
    title: "Ayıplı mal ve tüketicinin seçimlik hakları",
    content:
      "Ayıplı mal teslim edilmesi halinde tüketici; sözleşmeden dönme, ayıp oranında bedel indirimi, ücretsiz onarım veya ayıpsız misliyle değişim haklarından birini seçmekte serbesttir. Teslimden itibaren altı ay içinde ortaya çıkan ayıbın teslim anında var olduğu kabul edilir; aksini ispat satıcıya düşer. Zamanaşımı kural olarak iki yıl, ayıp gizlenmişse süresizdir.",
    ref: "Yargıtay 13. HD yerleşik içtihadı — 6502 s. K. m.8, m.11, m.12",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 13. HD",
    article_no: "tuketici-02",
    title: "Bankalarca alınan haksız masraf ve ücretlerin iadesi",
    content:
      "Tüketici kredilerinde, tüketiciyle ayrıca müzakere edilmeden tek yanlı olarak sözleşmeye konulan ve belgelendirilmeyen dosya masrafı, hesap işletim ücreti gibi kesintiler haksız şarttır ve iadesi gerekir. Bankanın, alınan ücretin gerçek bir hizmet karşılığı ve makul olduğunu ispat etmesi gerekir; ispatlanamayan kesintiler faiziyle iade edilir.",
    ref: "Yargıtay 13. HD yerleşik içtihadı — 6502 s. K. m.4, m.5",
  },

  // ── Yargıtay Ceza Daireleri
  {
    kind: "ictihat",
    code: "Yargıtay Ceza Genel Kurulu",
    article_no: "ceza-01",
    title: "Hukuka aykırı delil ve zehirli ağacın meyvesi",
    content:
      "Hukuka aykırı yöntemle elde edilen deliller hükme esas alınamaz; bu delillerden türeyen ikincil deliller de değerlendirme dışı bırakılır. Arama kararı olmaksızın veya kararın kapsamı aşılarak elde edilen bulgular ile usulüne uygun olmayan iletişim tespiti kayıtları hükme dayanak yapılamaz. Şüpheden sanık yararlanır ilkesi bu değerlendirmede birlikte uygulanır.",
    ref: "Yargıtay CGK yerleşik içtihadı — Anayasa m.38/6, CMK m.206, m.217",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 12. CD",
    article_no: "ceza-02",
    title: "Taksirle yaralamada kusur oranı ve bilinçli taksir",
    content:
      "Trafik kaynaklı taksirli suçlarda kusur, kaza tespit tutanağı ve bilirkişi raporu birlikte değerlendirilerek belirlenir; asli-tali kusur ayrımı cezanın belirlenmesinde esas alınır. Alkollü veya aşırı hızlı araç kullanma gibi neticeyi öngörmesine rağmen istemeyerek gerçekleştirme hallerinde bilinçli taksir uygulanır ve ceza artırılır.",
    ref: "Yargıtay 12. CD yerleşik içtihadı — TCK m.22, m.89",
  },
  {
    kind: "ictihat",
    code: "Yargıtay 4. CD",
    article_no: "ceza-03",
    title: "Hakaret suçunda eleştiri sınırı",
    content:
      "Ağır eleştiri niteliğindeki, rahatsız edici ancak kişinin onur ve saygınlığını rencide etmeyen sözler hakaret suçunu oluşturmaz. Değer yargısı ile olgu isnadı ayrımı yapılır; kamuya mal olmuş kişilere yönelik eleştiri sınırı daha geniştir. Somut olayda sözlerin bağlamı, ifade edildiği ortam ve karşılıklılık ilişkisi birlikte değerlendirilir.",
    ref: "Yargıtay 4. CD yerleşik içtihadı — TCK m.125, m.129",
  },

  // ── Danıştay
  {
    kind: "ictihat",
    code: "Danıştay 5. D",
    article_no: "idare-01",
    title: "Disiplin cezalarında savunma hakkı ve ölçülülük",
    content:
      "Disiplin cezası verilmeden önce ilgiliye isnat edilen fiil açıkça bildirilerek savunma hakkı tanınmalıdır; savunma alınmadan verilen ceza şekil yönünden hukuka aykırıdır. Ayrıca fiil ile ceza arasında ölçülülük bulunmalı ve soruşturma usulüne uygun yürütülmelidir. Zamanaşımı süreleri resen gözetilir.",
    ref: "Danıştay 5. D yerleşik içtihadı — 657 s. K. m.125, m.130",
  },
  {
    kind: "ictihat",
    code: "Danıştay 10. D",
    article_no: "idare-02",
    title: "İdari işlemde yetki, şekil, sebep, konu ve maksat denetimi",
    content:
      "İdari işlemler yetki, şekil, sebep, konu ve maksat unsurları yönünden hukuka uygunluk denetimine tabidir; bu unsurlardan birindeki sakatlık iptal sebebidir. İdarenin takdir yetkisi mutlak değildir; kamu yararı ve hizmet gereklerine aykırı kullanımı yargısal denetime tabidir. İşlemin gerekçesinin somut ve denetlenebilir olması gerekir.",
    ref: "Danıştay 10. D yerleşik içtihadı — 2577 s. K. m.2",
  },
  {
    kind: "ictihat",
    code: "Danıştay 10. D",
    article_no: "idare-03",
    title: "Hizmet kusuru ve idarenin tam yargı sorumluluğu",
    content:
      "İdarenin yürüttüğü hizmetin kötü işlemesi, geç işlemesi veya hiç işlememesi hizmet kusuru oluşturur ve tam yargı davasıyla tazmin sorumluluğu doğar. Kusursuz sorumluluk halleri (sosyal risk, tehlike ilkesi) istisnaidir. Dava, zararın öğrenilmesinden itibaren bir yıl ve her halde beş yıl içinde idareye başvuru koşuluyla açılır.",
    ref: "Danıştay 10. D yerleşik içtihadı — 2577 s. K. m.12-13",
  },
  {
    kind: "ictihat",
    code: "Danıştay VDDK",
    article_no: "vergi-01",
    title: "Vergi ziyaı cezasında ispat ve sahte belge değerlendirmesi",
    content:
      "Sahte belge kullanma iddiasına dayalı tarhiyatlarda, mükellefin ticari ilişkinin gerçekliğini ödeme belgeleri, sevk irsaliyesi ve nakliye kayıtlarıyla ortaya koyması halinde salt karşıt inceleme raporuna dayanan tarhiyat hukuka aykırıdır. Vergilendirmede işlemlerin gerçek mahiyeti esastır ve ispat külfeti iddia sahibindedir.",
    ref: "Danıştay VDDK yerleşik içtihadı — VUK m.3, m.344",
  },

  // ── Anayasa Mahkemesi (bireysel başvuru)
  {
    kind: "ictihat",
    code: "AYM",
    article_no: "aym-01",
    title: "Makul sürede yargılanma hakkı",
    content:
      "Yargılamanın makul sürede tamamlanmaması adil yargılanma hakkını ihlal eder. Makul sürenin belirlenmesinde davanın karmaşıklığı, tarafların ve yargı makamlarının tutumu ile başvurucu açısından davanın önemi birlikte değerlendirilir. İhlal tespiti halinde manevi tazminata hükmedilebilir ve karar ilgili mercie gönderilir.",
    ref: "AYM bireysel başvuru içtihadı — Anayasa m.36",
  },
  {
    kind: "ictihat",
    code: "AYM",
    article_no: "aym-02",
    title: "Mülkiyet hakkı ve ölçülülük",
    content:
      "Mülkiyet hakkına yapılan müdahalenin kanuni dayanağı bulunmalı, meşru amaç taşımalı ve ölçülü olmalıdır. Kişiye aşırı ve olağandışı külfet yükleyen müdahale ihlal oluşturur. Kamulaştırmasız el atma, uzun süren haciz veya bedelin geç ödenmesi gibi hallerde ölçülülük denetimi yapılır.",
    ref: "AYM bireysel başvuru içtihadı — Anayasa m.35",
  },
  {
    kind: "ictihat",
    code: "AYM",
    article_no: "aym-03",
    title: "Gerekçeli karar hakkı",
    content:
      "Mahkemelerin, tarafların davanın sonucuna etkili iddia ve savunmalarını karşılamaları gerekir. Esasa etkili iddiaların karşılanmaması gerekçeli karar hakkını ve dolayısıyla adil yargılanma hakkını ihlal eder. Gerekçe, kararın hangi maddi ve hukuki sebeplere dayandığını denetlenebilir biçimde göstermelidir.",
    ref: "AYM bireysel başvuru içtihadı — Anayasa m.36, m.141",
  },
  {
    kind: "ictihat",
    code: "AYM",
    article_no: "aym-04",
    title: "İfade özgürlüğü ve sosyal medya paylaşımları",
    content:
      "Sosyal medya paylaşımları nedeniyle uygulanan yaptırımlarda, ifadenin bağlamı, kullanılan dil, kamusal tartışmaya katkısı ve etkisi değerlendirilir. Şok edici veya rahatsız edici olması tek başına sınırlama sebebi değildir; müdahale demokratik toplumda gerekli ve ölçülü olmalıdır. Aksi halde ifade özgürlüğü ihlal edilmiş sayılır.",
    ref: "AYM bireysel başvuru içtihadı — Anayasa m.26",
  },
  {
    kind: "ictihat",
    code: "AYM",
    article_no: "aym-05",
    title: "Aile hayatına saygı ve kişisel ilişki kurma hakkı",
    content:
      "Çocukla kişisel ilişki kurulmasına dair kararların etkili biçimde icra edilmemesi aile hayatına saygı hakkını ihlal eder. Devletin pozitif yükümlülüğü, ilişkinin sürdürülmesi için makul ve gecikmesiz tedbirleri almayı içerir. Değerlendirmede çocuğun üstün yararı belirleyicidir.",
    ref: "AYM bireysel başvuru içtihadı — Anayasa m.20, m.41",
  },

  // ── Yargıtay Hukuk Genel Kurulu
  {
    kind: "ictihat",
    code: "Yargıtay HGK",
    article_no: "hgk-01",
    title: "Belirsiz alacak davası ve kısmi dava ayrımı",
    content:
      "Davanın açıldığı tarihte alacağın miktarı tam ve kesin olarak belirlenemiyorsa belirsiz alacak davası açılabilir; aksi halde dava hukuki yarar yokluğundan reddedilir. İşçilik alacaklarında hesaplama işveren kayıtlarına bağlıysa belirsiz alacak davası kabul edilir. Kısmi davada ise saklı tutulan kısım için zamanaşımı ıslah veya ek dava tarihinde kesilir.",
    ref: "Yargıtay HGK yerleşik içtihadı — HMK m.107, m.109",
  },
  {
    kind: "ictihat",
    code: "Yargıtay HGK",
    article_no: "hgk-02",
    title: "Zamanaşımı def'i ve ıslahın etkisi",
    content:
      "Zamanaşımı def'i cevap dilekçesinde ileri sürülmelidir; ıslahla artırılan kısma karşı davalı süresinde zamanaşımı def'inde bulunursa bu kısım yönünden zamanaşımı ıslah tarihine göre değerlendirilir. Hâkim zamanaşımını resen dikkate alamaz. İşçilik alacaklarında kural olarak beş yıllık zamanaşımı uygulanır.",
    ref: "Yargıtay HGK yerleşik içtihadı — TBK m.146 vd., HMK m.176",
  },
];
