import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function supabaseAs(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_thread_messages",
  title: "Sohbet mesajlarını getir",
  description:
    "Belirtilen sohbet dosyasındaki tüm mesajları (rol ve içerik) sırasıyla döndürür. Yalnızca kullanıcının kendi dosyalarına erişilebilir.",
  inputSchema: {
    threadId: z.string().uuid().describe("Sohbet dosyasının UUID kimliği."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ threadId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseAs(ctx.getToken()!);
    const { data, error } = await supabase
      .from("messages")
      .select("id,role,parts,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const flat = (data ?? []).map((m) => {
      const parts = m.parts as unknown as Array<{ type: string; text?: string }>;
      const text = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("\n");
      return { id: m.id, role: m.role, text, created_at: m.created_at };
    });
    return {
      content: [{ type: "text", text: JSON.stringify(flat) }],
      structuredContent: { messages: flat },
    };
  },
});
