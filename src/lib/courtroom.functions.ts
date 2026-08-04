import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTION_LABEL,
  BASE_RULES,
  CASE_TYPE_LABEL,
  ROLE_PERMISSIONS,
  USER_ROLE_LABEL,
  assertCourtAction,
  buildCaseParts,
  callModel,
  extractJson,
  transcriptToText,
  type CourtAction,
  type HearingSetup,
  type HearingTurn,
} from "@/lib/courtroom.server";

export type {
  HearingSetup,
  HearingTurn,
  CourtroomRole,
  CourtAction,
} from "@/lib/courtroom.server";

const caseTypeSchema = z.enum(["HUKUK", "CEZA", "IS", "AILE", "IDARE", "ICRA", "TUKETICI"]);
const userRoleSchema = z.enum([
  "HAKIM",
  "SAVCI",
  "DAVACI",
  "DAVALI",
  "SANIK",
  "KATILAN",
  "TANIK",
  "VEKIL",
]);
const actionSchema = z.enum([
  "BEYAN",
  "ITIRAZ",
  "DELIL",
  "SORU",
  "MUTALAA",
  "TANIK_CEVAP",
  "ARA_KARAR",
  "KARAR",
  "KARAR_TALEBI",
]);
const phaseSchema = z.enum(["ACILIS", "ON_INCELEME", "TAHKIKAT", "SOZLU", "HUKUM"]);


const turnSchema = z.object({
  role: z.string().max(40),
  speaker: z.string().max(80),
  text: z.string().max(6000),
});

/** Belge + beyandan duruşma salonunu kurar ve ilk celseyi üretir. */
export const openHearing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseFileId: z.string().uuid().optional(),
        statement: z.string().max(20000).optional(),
        caseType: caseTypeSchema,
        userRole: userRoleSchema,
      })
      .refine((v) => Boolean(v.caseFileId) || Boolean(v.statement?.trim()), {
        message: "Dava dosyası seçin veya olayı anlatın.",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI anahtarı eksik.");

    const { parts, label } = await buildCaseParts(context.supabase, data.caseFileId);
    if (!label && !data.statement?.trim()) {
      throw new Error("Dosya okunamadı; lütfen olayı kendi beyanınızla yazın.");
    }

    const prompt = `${BASE_RULES}

GÖREV: Aşağıdaki dosya/beyandan bir duruşma salonu kur ve İLK CELSEYİ yaz.

Dava türü: ${CASE_TYPE_LABEL[data.caseType]}
Kullanıcının sıfatı: ${USER_ROLE_LABEL[data.userRole]}

=== DOSYA ===
${label || "(belge yok)"}

=== KULLANICI BEYANI ===
${data.statement?.trim() || "(beyan yok)"}

İlk celse akışı: Hâkim duruşmayı açar ve dosya konusunu özetler → taraf vekilleri kısa beyanda bulunur → ceza davasıysa Cumhuriyet savcısı mütalaa yönünü belirtir → hâkim eksik delilleri sorar ve kullanıcıya söz verir. 5-8 konuşma yeter; her konuşma 2-5 cümle.

JSON şeması:
{"setup":{"title":"","court":"","caseType":"","parties":["",""],"evidence":[""],"missing":[""]},
 "turns":[{"role":"HAKIM|SAVCI|DAVACI_VEKILI|DAVALI_VEKILI|MUDAFI|BILIRKISI|KATIP|TARAF","speaker":"","text":""}]}

"evidence": yalnızca dosyada/beyanda GERÇEKTEN geçen deliller. "missing": duruşma için eksik olan belge/bilgiler.`;

    const raw = await callModel(key, prompt, parts);
    const parsed = extractJson<{ setup: HearingSetup; turns: HearingTurn[] }>(raw);
    if (!parsed?.turns?.length) throw new Error("Duruşma kurulamadı, tekrar deneyin.");
    return {
      setup: {
        title: parsed.setup?.title ?? "Duruşma",
        court: parsed.setup?.court ?? "",
        caseType: CASE_TYPE_LABEL[data.caseType],
        parties: parsed.setup?.parties ?? [],
        evidence: parsed.setup?.evidence ?? [],
        missing: parsed.setup?.missing ?? [],
      } satisfies HearingSetup,
      turns: parsed.turns,
    };
  });

/** Kullanıcının sıfatına göre yapabileceği işlemleri döner. */
export const listAllowedActions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userRole: userRoleSchema }).parse(d))
  .handler(async ({ data }) => ({
    userRole: data.userRole,
    actions: ROLE_PERMISSIONS[data.userRole] ?? [],
  }));

/** Kullanıcı söz alır; duruşma devam eder. */
export const continueHearing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseFileId: z.string().uuid().optional(),
        statement: z.string().max(20000).optional(),
        caseType: caseTypeSchema,
        userRole: userRoleSchema,
        action: actionSchema,
        phase: phaseSchema.optional(),
        transcript: z.array(turnSchema).max(80),
        userStatement: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Yetki kontrolü: sıfatı bu işleme izin vermiyorsa duruşma ilerlemez.
    assertCourtAction(data.userRole, data.action as CourtAction);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI anahtarı eksik.");

    const { parts, label } = await buildCaseParts(context.supabase, data.caseFileId);

    const prompt = `${BASE_RULES}

GÖREV: Devam eden duruşmada kullanıcının işleminden sonraki konuşmaları yaz.

Dava türü: ${CASE_TYPE_LABEL[data.caseType]}
Kullanıcının sıfatı: ${USER_ROLE_LABEL[data.userRole]}
Kullanıcının yaptığı usulî işlem: ${ACTION_LABEL[data.action as CourtAction]}
Celse aşaması: ${data.phase ?? "ACILIS"}

USUL YETKİSİ: Kullanıcı yalnızca kendi sıfatının yetkili olduğu işlemi yapar. Hüküm kurmayı yalnızca hâkim, esas hakkında mütalaayı yalnızca Cumhuriyet savcısı yapabilir; tanık yalnızca kendisine sorulan soruyu cevaplar. Kullanıcı sıfatını aşan bir talepte bulunursa hâkim bunu usulen reddetsin.

=== DOSYA ===
${label || "(belge yok)"}

=== OLAY ANLATIMI ===
${data.statement?.trim() || "(beyan yok)"}

=== DURUŞMA TUTANAĞI (şu ana kadar) ===
${transcriptToText(data.transcript as HearingTurn[]).slice(-12000)}

=== KULLANICININ SON İŞLEMİ (${USER_ROLE_LABEL[data.userRole]} — ${ACTION_LABEL[data.action as CourtAction]}) ===
${data.userStatement}

Bu aşamanın dışına taşma. AÇILIŞ/ÖN İNCELEMEDE usulî itirazlar, taraf sıfatları, talepler ve eksiklerin tespiti; TAHKİKATTA deliller, tanık ve bilirkişi; SÖZLÜ YARGILAMADA esas hakkındaki beyanlar ve mütalaa; HÜKÜMDE yalnızca hâkimin taslak hüküm yönü konuşulabilir. Kullanıcının işleminden sonra karşı tarafın cevabı/itirazı, hâkimin soruları veya ara kararı ve gerekiyorsa savcı/bilirkişi görüşü ile devam et. 3-6 konuşma; her biri 2-5 cümle. İşlemin hukuken zayıf yanı varsa karşı taraf bunu usulen dile getirsin.

JSON: {"turns":[{"role":"","speaker":"","text":""}]}`;

    const raw = await callModel(key, prompt, parts);
    const parsed = extractJson<{ turns: HearingTurn[] }>(raw);
    if (!parsed?.turns?.length) throw new Error("Duruşma devam ettirilemedi.");
    return { turns: parsed.turns };
  });

/** Hâkim kararını (gerekçeli karar taslağı) verir. */
export const closeHearing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseFileId: z.string().uuid().optional(),
        caseType: caseTypeSchema,
        userRole: userRoleSchema,
        transcript: z.array(turnSchema).max(80),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Kararı hâkim tefhim eder; diğer sıfatlar yalnızca karar talebinde bulunabilir.
    assertCourtAction(data.userRole, data.userRole === "HAKIM" ? "KARAR" : "KARAR_TALEBI");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI anahtarı eksik.");


    const { parts, label } = await buildCaseParts(context.supabase, data.caseFileId);

    const prompt = `Sen bir duruşma simülasyonunu sonlandıran hâkimsin. ${BASE_RULES.split("ÇIKTI:")[0]}

GÖREV: Aşağıdaki tutanağa dayanarak gerekçeli karar TASLAĞI yaz. Markdown, kısa ve resmî:

**GEREKÇELİ KARAR TASLAĞI (SİMÜLASYON)**
1) TESPİT EDİLEN OLGULAR — yalnızca dosyada/tutanakta geçenler.
2) DEĞERLENDİRME — güçlü ve zayıf yönler, ispat yükü.
3) HÜKÜM YÖNÜ — olasılıklı ifadeyle (kabul/kısmen kabul/ret ihtimali ve nedeni).
4) TARAFA TAVSİYE — bu sonucu değiştirebilecek somut delil ve adımlar.

Uydurma karar/madde numarası yok. Çıktı düz markdown metin olsun, JSON değil.

=== DOSYA ===
${label || "(belge yok)"}

=== DURUŞMA TUTANAĞI ===
${transcriptToText(data.transcript as HearingTurn[]).slice(-14000)}`;

    const text = await callModel(key, prompt, parts);
    return { text: text.trim() };
  });

/** Standart rapor formatı ve kaynak gösterme kuralı (celse özeti + kanun yolu). */
const REPORT_RULES = `RAPOR BİÇİMİ (ZORUNLU):
- Çıktı düz markdown olsun, JSON veya kod bloğu kullanma.
- Başlıkları verilen sırayla ve verilen adlarla yaz; boş kalan başlığa "Dosyada bilgi yok." yaz.
- Her hukuki dayanağın hemen ardından kaynağı köşeli parantezle göster:
  mevzuat için [Kaynak: KANUN_ADI m.MADDE_NO], içtihat için [Kaynak: MAHKEME E.YIL/NO K.YIL/NO].
- Emin olmadığın dayanak için madde/karar numarası UYDURMA; onun yerine [Genel İlke] yaz.
- Tutanakta geçmeyen olay, tarih, tutar veya delil ekleme.`;

/** Her celse sonunda kaynaklı, standart formatlı duruşma özeti üretir. */
export const summarizeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseType: caseTypeSchema,
        userRole: userRoleSchema,
        sessionNo: z.number().int().min(1).max(200),
        transcript: z.array(turnSchema).max(80),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI anahtarı eksik.");

    const prompt = `Sen bir duruşma tutanağını raporlayan Türk hukukçususun. ${BASE_RULES.split("ÇIKTI:")[0]}

GÖREV: ${data.sessionNo}. celsenin standart formatlı, kaynaklı özetini yaz.

${REPORT_RULES}

**${data.sessionNo}. CELSE ÖZETİ (SİMÜLASYON)**
1) CELSE KONUSU — 1-2 cümle.
2) TARAF BEYANLARI — kim ne beyan etti, madde madde.
3) İTİRAZLAR VE USULÎ İŞLEMLER — ileri sürülen itirazlar ve hâkimin tutumu.
4) DELİL DURUMU — sunulan deliller ve eksik kalanlar.
5) HUKUKİ DAYANAKLAR — celsede tartışılan hükümler; her biri [Kaynak: ...] veya [Genel İlke] etiketli.
6) ARA KARARLAR — verilmişse; yoksa "Ara karar verilmedi.".
7) SONRAKİ CELSEYE HAZIRLIK — tamamlanacak belge ve beyanlar.

Dava türü: ${CASE_TYPE_LABEL[data.caseType]}
Raporu isteyen sıfat: ${USER_ROLE_LABEL[data.userRole]}

=== DURUŞMA TUTANAĞI ===
${transcriptToText(data.transcript as HearingTurn[]).slice(-14000)}`;

    const text = await callModel(key, prompt);
    return { sessionNo: data.sessionNo, text: text.trim() };
  });

/** Karar sonrası istinaf/temyiz değerlendirmesi ve strateji notu üretir. */
export const assessAppeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseType: caseTypeSchema,
        userRole: userRoleSchema,
        transcript: z.array(turnSchema).max(80),
        verdict: z.string().min(1).max(20000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI anahtarı eksik.");

    const prompt = `Sen deneyimli bir Türk avukatısın. ${BASE_RULES.split("ÇIKTI:")[0]}

GÖREV: Aşağıdaki simülasyon kararına karşı ${USER_ROLE_LABEL[data.userRole]} sıfatındaki kullanıcı için kanun yolu değerlendirmesi yaz.

${REPORT_RULES}

**KANUN YOLU DEĞERLENDİRMESİ (SİMÜLASYON)**
1) KARARIN ÖZETİ — bir paragraf.
2) İSTİNAF/TEMYİZ SEBEPLERİ — tutanaktan çıkan somut usul ve esas sebepleri madde madde; her sebebin sonunda [Kaynak: ...] veya [Genel İlke].
3) BAŞARI İHTİMALİ — düşük/orta/yüksek ve nedeni; kesin vaat verme.
4) SÜRE VE USUL UYARISI — genel süre kuralını hatırlat, somut tarih uydurma.
5) YAPILACAKLAR LİSTESİ — hangi delil/belge tamamlanmalı, hangi beyan güçlendirilmeli.
6) KAYNAKÇA — raporda atıf yapılan mevzuat/içtihat listesi; yoksa "Doğrulanmış kaynak gösterilmedi.".

Dava türü: ${CASE_TYPE_LABEL[data.caseType]}

=== DURUŞMA TUTANAĞI ===
${transcriptToText(data.transcript as HearingTurn[]).slice(-12000)}

=== KARAR ===
${data.verdict.slice(0, 8000)}`;

    const text = await callModel(key, prompt);
    return { text: text.trim() };
  });

