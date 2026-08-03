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
  name: "create_thread",
  title: "Yeni sohbet dosyası oluştur",
  description: "Giriş yapan kullanıcı adına yeni bir Hukuk Master AI sohbet dosyası oluşturur.",
  inputSchema: {
    title: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional()
      .describe("Dosya başlığı. Boş bırakılırsa 'Yeni Dosya' kullanılır."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseAs(ctx.getToken()!);
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: ctx.getUserId()!, title: title ?? "Yeni Dosya" })
      .select("id,title,updated_at,created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { thread: data },
    };
  },
});
