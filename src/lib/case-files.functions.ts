import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText } from "ai";

export type CaseFile = {
  id: string;
  title: string;
  storage_path: string;
  mime: string | null;
  size_bytes: number | null;
  extracted_text: string | null;
  uyap_no: string | null;
  court: string | null;
  bot_active: boolean;
  last_analyzed_at: string | null;
  created_at: string;
};

export type CaseReport = {
  id: string;
  case_file_id: string | null;
  summary: string;
  matches: Array<{ update_id?: string; note?: string }>;
  created_at: string;
};

/** Kullanıcının dava dosyalarını listele. */
export const listCaseFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("case_files")
      .select(
        "id,title,storage_path,mime,size_bytes,extracted_text,uyap_no,court,bot_active,last_analyzed_at,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CaseFile[];
  });

/** Yeni dava dosyası kaydı oluştur (dosya storage'a yüklendikten sonra). */
export const createCaseFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        storage_path: z.string().min(1).max(500),
        mime: z.string().max(120).optional(),
        size_bytes: z.number().int().nonnegative().optional(),
        uyap_no: z.string().max(120).optional(),
        court: z.string().max(200).optional(),
        extracted_text: z.string().max(200_000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("case_files")
      .insert({
        user_id: context.userId,
        title: data.title,
        storage_path: data.storage_path,
        mime: data.mime ?? null,
        size_bytes: data.size_bytes ?? null,
        uyap_no: data.uyap_no ?? null,
        court: data.court ?? null,
        extracted_text: data.extracted_text ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCaseFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        uyap_no: z.string().max(120).optional(),
        court: z.string().max(200).optional(),
        extracted_text: z.string().max(200_000).optional(),
        bot_active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("case_files").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCaseFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Fetch to know storage_path
    const { data: row } = await context.supabase
      .from("case_files")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("case_files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.storage_path) {
      await context.supabase.storage.from("case-files").remove([row.storage_path]);
    }
    return { ok: true };
  });

/** Kullanıcının son raporlarını listele. */
export const listCaseReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("case_reports")
      .select("id,case_file_id,summary,matches,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []) as CaseReport[];
  });

/** Tek bir raporu sil. */
export const deleteCaseReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("case_reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Bot şimdi tüm aktif dosyaları güncel gündemle eşleştirsin ve rapor üretsin. */
export const analyzeMyCaseFilesNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ caseFileId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI anahtarı eksik.");

    let q = context.supabase
      .from("case_files")
      .select("id,title,storage_path,mime,uyap_no,court,extracted_text,bot_active")
      .order("created_at", { ascending: false });
    if (data.caseFileId) q = q.eq("id", data.caseFileId);
    else q = q.eq("bot_active", true);

    const { data: files, error: fErr } = await q;
    if (fErr) throw new Error(fErr.message);
    if (!files || files.length === 0) {
      return { ok: false as const, reason: "Aktif dava dosyası yok." };
    }

    const { data: updates } = await context.supabase
      .from("daily_updates")
      .select("id,kind,title,summary,ref,url,source,tags,published_at")
      .order("published_at", { ascending: false })
      .limit(40);

    const updatesBlock = (updates ?? [])
      .map(
        (u) =>
          `- [${u.kind}] ${u.title}${u.ref ? ` (${u.ref})` : ""} — ${u.summary?.slice(0, 320) ?? ""}${
            u.url ? `\n  Kaynak: ${u.url}` : ""
          }`,
      )
      .join("\n");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3.6-flash");

    const READABLE = /^(application\/pdf|image\/(png|jpe?g|webp|heic|heif))$/i;

    const reports: CaseReport[] = [];

    for (const f of files) {
      // Gerçek belge içeriğini modele gönder: PDF/görsel ise storage'dan indir.
      const contentParts: Array<Record<string, unknown>> = [];
      let attached = false;
      if (f.mime && READABLE.test(f.mime)) {
        try {
          const { data: blob } = await context.supabase.storage
            .from("case-files")
            .download(f.storage_path);
          if (blob) {
            const buf = new Uint8Array(await blob.arrayBuffer());
            if (buf.byteLength > 0 && buf.byteLength <= 15 * 1024 * 1024) {
              contentParts.push({ type: "file", data: buf, mediaType: f.mime });
              attached = true;
            }
          }
        } catch (e) {
          console.error("case file download failed", f.id, e);
        }
      }

      const notes = (f.extracted_text ?? "").slice(0, 12000);
      if (!attached && !notes.trim()) {
        continue;
      }

      const prompt = `Sen Türk hukuku alanında uzman bir avukat asistanısın. Aşağıdaki DAVA DOSYASINI gerçekten incele ve somut bir rapor yaz.

Rapor formatı:
1) DOSYA ÖZETİ — taraflar, konu, talep, mevcut aşama (belgeden çıkarabildiğin kadarıyla).
2) HUKUKİ DEĞERLENDİRME — ilgili kanun maddeleri ve dosyanın güçlü/zayıf yönleri.
3) GÜNDEMLE EŞLEŞME — aşağıdaki güncel gelişmelerden yalnızca bu dosyayla GERÇEKTEN ilgili olanları yaz; ilgili yoksa "Bu dönem dosyayla doğrudan ilgili yeni gelişme yok." de.
4) YAPILACAKLAR — somut, uygulanabilir adımlar (dilekçe, delil, süre).

Kurallar: Uydurma karar/madde numarası ÜRETME. Belgede olmayan bilgiyi varsayma; eksikse "belgede yok" yaz. Abartılı uyarı ve genel hukuki feragat cümleleri kullanma. Türkçe, madde madde, kısa.

=== DOSYA ===
Başlık: ${f.title}${f.uyap_no ? `\nUYAP No: ${f.uyap_no}` : ""}${f.court ? `\nMahkeme: ${f.court}` : ""}
${attached ? "Belge ektedir (aşağıdaki dosyayı oku)." : ""}
${notes ? `Kullanıcı notları:\n${notes}` : ""}

=== SON HUKUKİ GELİŞMELER ===
${updatesBlock}`;

      contentParts.unshift({ type: "text", text: prompt });

      try {
        const { text } = await generateText({
          model,
          messages: [{ role: "user", content: contentParts as never }],
        });

        const { data: inserted, error: iErr } = await context.supabase
          .from("case_reports")
          .insert({
            user_id: context.userId,
            case_file_id: f.id,
            summary: `### ${f.title}\n\n${text}`,
            matches: [],
            model: "google/gemini-3.6-flash",
          })
          .select("id,case_file_id,summary,matches,created_at")
          .single();
        if (iErr) throw new Error(iErr.message);
        reports.push(inserted as CaseReport);

        await context.supabase
          .from("case_files")
          .update({ last_analyzed_at: new Date().toISOString() })
          .eq("id", f.id);
      } catch (e) {
        console.error("case file analysis failed", f.id, e);
      }
    }

    if (reports.length === 0) {
      return {
        ok: false as const,
        reason:
          "Analiz edilebilecek içerik bulunamadı. PDF/görsel yükleyin veya dosyaya not ekleyin.",
      };
    }

    return { ok: true as const, report: reports[0], reports };
  });

/** Storage nesnesine kısa süreli imzalı okuma URL'i. */
export const signCaseFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("case_files")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Bulunamadı.");
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("case-files")
      .createSignedUrl(row.storage_path, 300);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });
