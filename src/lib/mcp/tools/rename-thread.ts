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
  name: "rename_thread",
  title: "Sohbet dosyasını yeniden adlandır",
  description: "Kullanıcının kendi sohbet dosyasının başlığını günceller.",
  inputSchema: {
    threadId: z.string().uuid().describe("Yeniden adlandırılacak dosyanın UUID kimliği."),
    title: z.string().trim().min(1).max(120).describe("Yeni başlık."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ threadId, title }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseAs(ctx.getToken()!);
    const { error } = await supabase.from("threads").update({ title }).eq("id", threadId);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return { content: [{ type: "text", text: "ok" }], structuredContent: { ok: true } };
  },
});
