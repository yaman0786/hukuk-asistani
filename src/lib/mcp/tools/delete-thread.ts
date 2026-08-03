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
  name: "delete_thread",
  title: "Sohbet dosyasını sil",
  description:
    "Kullanıcının kendi sohbet dosyasını (ve içindeki tüm mesajları) kalıcı olarak siler. Geri alınamaz.",
  inputSchema: {
    threadId: z.string().uuid().describe("Silinecek dosyanın UUID kimliği."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ threadId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseAs(ctx.getToken()!);
    const { error } = await supabase.from("threads").delete().eq("id", threadId);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return { content: [{ type: "text", text: "ok" }], structuredContent: { ok: true } };
  },
});
