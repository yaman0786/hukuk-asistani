import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        messageId: z.string().uuid(),
        rating: z.union([z.literal(-1), z.literal(1)]),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("message_feedback").upsert(
      {
        message_id: data.messageId,
        user_id: context.userId,
        rating: data.rating,
        reason: data.reason ?? null,
      },
      { onConflict: "message_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getFeedbackForMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ messageIds: z.array(z.string().uuid()).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.messageIds.length === 0) return {} as Record<string, number>;
    const { data: rows, error } = await context.supabase
      .from("message_feedback")
      .select("message_id,rating")
      .in("message_id", data.messageIds)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const map: Record<string, number> = {};
    for (const r of rows ?? []) map[r.message_id as string] = r.rating as number;
    return map;
  });
