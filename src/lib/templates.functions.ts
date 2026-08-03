import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listTemplates = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("templates")
    .select("id,slug,kind,title,description,variables,sort_order")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const RunSchema = z.object({
  slug: z.string().min(1),
  values: z.record(z.string(), z.string()).default({}),
});

export const startFromTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RunSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: tpl, error } = await context.supabase
      .from("templates")
      .select("title,prompt_template,variables")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error || !tpl) throw new Error("Şablon bulunamadı");

    let filled = tpl.prompt_template;
    const vars = (tpl.variables as Array<{ key: string; label?: string }>) ?? [];
    for (const v of vars) {
      const val = data.values[v.key]?.trim() || `[${v.label ?? v.key}]`;
      filled = filled.replaceAll(`{{${v.key}}}`, val);
    }

    const { data: thread, error: tErr } = await context.supabase
      .from("threads")
      .insert({ user_id: context.userId, title: tpl.title.slice(0, 60) })
      .select("id")
      .single();
    if (tErr) throw new Error(tErr.message);

    // Do NOT seed a message here — the client will call sendMessage with `prompt`
    // so the AI actually generates the petition and streams it to the UI.
    return { threadId: thread.id, prompt: filled };
  });
