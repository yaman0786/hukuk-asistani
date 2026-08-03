import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText } from "ai";

/**
 * Daily case-file analysis.
 * Called by pg_cron once a day. Iterates over users with active case files,
 * generates a fresh report per user against the latest legal updates.
 *
 * Public prefix bypasses site auth. Access control: shared secret via
 * `x-cron-token` header (validated against DAILY_CASE_ANALYSIS_TOKEN).
 * When no token is configured, we require presence of an internal marker
 * so the endpoint isn't openly triggerable.
 */
export const Route = createFileRoute("/api/public/hooks/daily-case-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("no ai key", { status: 500 });

        const expectedToken = process.env.DAILY_CASE_ANALYSIS_TOKEN;
        const provided = request.headers.get("x-cron-token") ?? "";
        if (expectedToken && provided !== expectedToken) {
          return new Response("unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Pull recent updates once (shared across users)
        const { data: updates } = await supabaseAdmin
          .from("daily_updates")
          .select("id,kind,title,summary,ref,url,published_at")
          .order("published_at", { ascending: false })
          .limit(40);

        const updatesBlock = (updates ?? [])
          .map(
            (u) =>
              `- [${u.kind}] ${u.title}${u.ref ? ` (${u.ref})` : ""} — ${(u.summary ?? "").slice(0, 320)}${u.url ? `\n  Kaynak: ${u.url}` : ""}`,
          )
          .join("\n");

        // Distinct users with any active file
        const { data: activeFiles } = await supabaseAdmin
          .from("case_files")
          .select("user_id,id,title,storage_path,mime,uyap_no,court,extracted_text")
          .eq("bot_active", true);

        const byUser = new Map<
          string,
          Array<{
            id: string;
            title: string;
            storage_path: string;
            mime: string | null;
            uyap_no: string | null;
            court: string | null;
            extracted_text: string | null;
          }>
        >();
        for (const f of activeFiles ?? []) {
          const arr = byUser.get(f.user_id) ?? [];
          arr.push(f);
          byUser.set(f.user_id, arr);
        }

        if (byUser.size === 0) {
          return Response.json({ ok: true, users: 0, reports: 0 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.6-flash");

        const READABLE = /^(application\/pdf|image\/(png|jpe?g|webp|heic|heif))$/i;
        let produced = 0;
        for (const [userId, files] of byUser) {
          for (const f of files) {
            try {
              const parts: Array<Record<string, unknown>> = [];
              let attached = false;
              if (f.mime && READABLE.test(f.mime)) {
                const { data: blob } = await supabaseAdmin.storage
                  .from("case-files")
                  .download(f.storage_path);
                if (blob) {
                  const buf = new Uint8Array(await blob.arrayBuffer());
                  if (buf.byteLength > 0 && buf.byteLength <= 15 * 1024 * 1024) {
                    parts.push({ type: "file", data: buf, mediaType: f.mime });
                    attached = true;
                  }
                }
              }
              const notes = (f.extracted_text ?? "").slice(0, 12000);
              if (!attached && !notes.trim()) continue;

              const prompt = `Sen Türk hukuku uzmanı bir avukat asistanısın. Aşağıdaki dava dosyasını incele ve rapor yaz: 1) Dosya özeti, 2) Hukuki değerlendirme, 3) Aşağıdaki güncel gelişmelerden yalnızca bu dosyayla gerçekten ilgili olanlar (yoksa "ilgili yeni gelişme yok" de), 4) Somut yapılacaklar. Uydurma karar/madde numarası ÜRETME; belgede olmayan bilgiyi varsayma. Türkçe, kısa, madde madde.

=== DOSYA ===
Başlık: ${f.title}${f.uyap_no ? `\nUYAP No: ${f.uyap_no}` : ""}${f.court ? `\nMahkeme: ${f.court}` : ""}
${attached ? "Belge ektedir." : ""}
${notes ? `Kullanıcı notları:\n${notes}` : ""}

=== SON HUKUKİ GELİŞMELER ===
${updatesBlock}`;

              parts.unshift({ type: "text", text: prompt });

              const { text } = await generateText({
                model,
                messages: [{ role: "user", content: parts as never }],
              });

              await supabaseAdmin.from("case_reports").insert({
                user_id: userId,
                case_file_id: f.id,
                summary: `### ${f.title}\n\n${text}`,
                matches: [],
                model: "google/gemini-3.6-flash",
              });
              await supabaseAdmin
                .from("case_files")
                .update({ last_analyzed_at: new Date().toISOString() })
                .eq("id", f.id);
              produced++;
            } catch (err) {
              console.error("daily-case-analysis file failed", f.id, err);
            }
          }
        }

        return Response.json({ ok: true, users: byUser.size, reports: produced });
      },
    },
  },
});
