import { createFileRoute } from "@tanstack/react-router";
import { limitsForTier } from "@/lib/rate-limits";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { HUKUK_SYSTEM_PROMPT } from "@/lib/system-prompt";

type Body = { messages?: UIMessage[]; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId } = (await request.json()) as Body;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        // Never allow a caller to write to or use the context of another user's thread.
        // The client supplies threadId, so ownership must be enforced server-side.
        const { data: ownedThread, error: threadErr } = await supabase
          .from("threads")
          .select("id")
          .eq("id", threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (threadErr || !ownedThread) {
          return new Response("Thread bulunamadı veya erişim yetkiniz yok.", { status: 404 });
        }

        // Progressive cooldown: block early if user is currently in penalty window.
        const { checkBlocked, recordStrike } = await import("@/lib/abuse-guard.server");
        const block = await checkBlocked(userId);
        if (block.blocked) {
          const mins = Math.ceil(block.retryAfterSeconds / 60);
          return new Response(
            JSON.stringify({
              error: `Tekrarlanan ihlaller nedeniyle geçici olarak engellendiniz. Yaklaşık ${mins} dakika sonra tekrar deneyin.`,
              blocked_until: block.until,
            }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": String(block.retryAfterSeconds),
              },
            },
          );
        }

        // Rate limiting: 20 messages/hour, 200/day (per user)
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        const [{ count: hourCount }, { count: dayCount }] = await Promise.all([
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("role", "user")
            .gte("created_at", oneHourAgo),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("role", "user")
            .gte("created_at", oneDayAgo),
        ]);

        // Tier-based quota: free / pro / kurumsal
        const clientEnvHeader = request.headers.get("x-paddle-env");
        const paddleEnv =
          clientEnvHeader === "sandbox" || clientEnvHeader === "live" ? clientEnvHeader : "live";
        const { data: tierData } = await supabase.rpc("get_user_tier", {
          _user_id: userId,
          _env: paddleEnv,
        });
        const tier = (tierData as string | null) ?? "free";
        const { hour: HOUR_LIMIT, day: DAY_LIMIT } = limitsForTier(tier);
        if ((hourCount ?? 0) >= HOUR_LIMIT) {
          await recordStrike(userId);
          return new Response(
            JSON.stringify({
              error: `Saatlik mesaj limitine (${HOUR_LIMIT}) ulaştınız. Lütfen bir süre sonra tekrar deneyin.`,
            }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": "3600",
              },
            },
          );
        }
        if ((dayCount ?? 0) >= DAY_LIMIT) {
          await recordStrike(userId);
          return new Response(
            JSON.stringify({
              error: `Günlük mesaj limitine (${DAY_LIMIT}) ulaştınız. Yarın tekrar deneyebilirsiniz.`,
            }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": "86400",
              },
            },
          );
        }

        // Basic abuse protection: reject oversized inputs
        const MAX_MESSAGES = 100;
        const MAX_TEXT_LEN = 8000;
        if (messages.length > MAX_MESSAGES) {
          await recordStrike(userId);
          return new Response("Konuşma çok uzun.", { status: 413 });
        }
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const lastUserText = lastUser
          ? (lastUser.parts as Array<{ type: string; text?: string }>)
              .filter((p) => p.type === "text")
              .map((p) => p.text ?? "")
              .join("")
          : "";
        if (lastUserText.length > MAX_TEXT_LEN) {
          await recordStrike(userId);
          return new Response("Mesaj çok uzun (maks. 8000 karakter).", { status: 413 });
        }

        // Server-side file attachment validation (mirrors the browser UI limits)
        const MAX_FILES_PER_MSG = 5;
        const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
        const MAX_TOTAL_FILE_BYTES = 25 * 1024 * 1024; // 25 MB / request
        const MAX_FILES_PER_REQUEST = 20;
        const ALLOWED_MEDIA = /^(image\/(png|jpe?g|webp|gif|heic|heif)|application\/pdf)$/i;

        // Estimate decoded bytes from base64/data URL length: floor(len * 3/4)
        const decodedSize = (s: string) => Math.floor((s.length * 3) / 4);

        let totalFiles = 0;
        let totalBytes = 0;
        for (const m of messages) {
          if (m.role !== "user") continue;
          const parts =
            (m.parts as Array<{ type: string; mediaType?: string; url?: string; data?: string }>) ??
            [];
          const fileParts = parts.filter((p) => p.type === "file");
          if (fileParts.length > MAX_FILES_PER_MSG) {
            await recordStrike(userId);
            return new Response(
              `Bir mesajda en fazla ${MAX_FILES_PER_MSG} dosya ekleyebilirsiniz.`,
              { status: 413 },
            );
          }
          for (const p of fileParts) {
            totalFiles += 1;
            if (!p.mediaType || !ALLOWED_MEDIA.test(p.mediaType)) {
              await recordStrike(userId);
              return new Response(
                "Desteklenmeyen dosya türü. Yalnızca PDF ve görseller kabul edilir.",
                {
                  status: 400,
                },
              );
            }
            const payload =
              typeof p.url === "string" ? p.url : typeof p.data === "string" ? p.data : "";
            // Strip data URL prefix if present
            const b64 = payload.startsWith("data:")
              ? payload.slice(payload.indexOf(",") + 1)
              : payload;
            const size = decodedSize(b64);
            if (size > MAX_FILE_BYTES) {
              await recordStrike(userId);
              return new Response("Dosya boyutu 10 MB sınırını aşıyor.", { status: 413 });
            }
            totalBytes += size;
          }
        }
        if (totalFiles > MAX_FILES_PER_REQUEST) {
          await recordStrike(userId);
          return new Response(`İstek başına en fazla ${MAX_FILES_PER_REQUEST} dosya.`, {
            status: 413,
          });
        }
        if (totalBytes > MAX_TOTAL_FILE_BYTES) {
          await recordStrike(userId);
          return new Response("Toplam dosya boyutu 25 MB sınırını aşıyor.", { status: 413 });
        }

        // Persist the last user message
        if (lastUser) {
          await supabase.from("messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as unknown as object,
          });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // RAG: pull related statutes for the last user message and inject them into system prompt.
        let systemPrompt = `${HUKUK_SYSTEM_PROMPT}\n\nBUGÜNÜN TARİHİ: ${new Date().toLocaleDateString("tr-TR")}. Tarihe bağlı hükümler için olay tarihini ayrıca sor ve olay tarihindeki hukuk ile güncel hukuku birbirine karıştırma.`;
        let retrievalStatus = "Bu yanıtta doğrulanmış mevzuat eşleşmesi bulunamadı.";
        if (lastUserText.trim().length > 8) {
          try {
            const { matchLegalDocuments, buildRagContext } = await import("@/lib/rag.server");
            const matches = await matchLegalDocuments(lastUserText, 6);
            if (matches.length > 0) {
              systemPrompt += buildRagContext(matches);
              retrievalStatus = "Aşağıdaki mevzuat eşleşmeleri yalnızca destekleyici arama bağlamıdır; metni ve yürürlük durumunu kontrol etmeden kesin hüküm verme.";
            }
          } catch (e) {
            console.error("rag lookup failed", e);
          }
        }
        systemPrompt += `\n\nDOĞRULUK GATE: ${retrievalStatus}\n- Kaynak bağlamı yoksa kanun maddesi, karar numarası, süre, harç veya parasal tutar için kesin ifade kullanma.\n- Kullanıcının olayındaki kritik eksik bilgileri en fazla 3 net soruyla iste.\n- Cevabın başında gerekiyorsa “Doğrulama gerekli” etiketi kullan.\n- Bir kaynağı doğrulayamadığında bunu açıkça söyle; tahmin ederek tamamlamaya çalışma.\n- Yanıtı gereksiz uzunlukta değil, uygulanabilir ve katmanlı ver: kısa sonuç → riskler → seçenekler → sonraki adım.`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          temperature: 0.15,
          maxOutputTokens: 5000,
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage, isAborted }) => {
            // On abort, the client persists the partial assistant message
            // (Cloudflare workers may terminate this handler before completion).
            if (isAborted) return;
            if (!responseMessage.parts || responseMessage.parts.length === 0) return;
            try {
              await supabase.from("messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: responseMessage.parts as unknown as object,
              });
              // Auto-title thread if it's still default
              const { data: t } = await supabase
                .from("threads")
                .select("title")
                .eq("id", threadId)
                .maybeSingle();
              if (t && t.title === "Yeni Dosya" && lastUser) {
                const firstText = (lastUser.parts as Array<{ type: string; text?: string }>).find(
                  (p) => p.type === "text",
                )?.text;
                if (firstText) {
                  const title = firstText.slice(0, 60).replace(/\s+/g, " ").trim();
                  await supabase.from("threads").update({ title }).eq("id", threadId);
                }
              }
            } catch (e) {
              console.error("persist assistant message failed", e);
            }
          },
        });
      },
    },
  },
});
