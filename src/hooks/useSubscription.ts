import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

export type Tier = "free" | "pro" | "kurumsal";

export type Sub = {
  status: string;
  product_id: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  paddle_subscription_id: string;
};

export function tierFromProduct(productId: string | undefined): Tier {
  if (productId === "hukuk_kurumsal") return "kurumsal";
  if (productId === "hukuk_pro") return "pro";
  return "free";
}

export function useSubscription(userId: string | undefined) {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSub(null);
      setLoading(false);
      return;
    }
    let alive = true;
    const env = getPaddleEnvironment();
    const load = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select(
          "status,product_id,price_id,current_period_end,cancel_at_period_end,paddle_subscription_id",
        )
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (alive) {
        setSub(data as Sub | null);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel(`subs:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const isActive =
    !!sub &&
    ((["active", "trialing", "past_due"].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) ||
      (sub.status === "canceled" &&
        sub.current_period_end &&
        new Date(sub.current_period_end) > new Date()));

  const tier: Tier = isActive ? tierFromProduct(sub?.product_id) : "free";

  return { sub, tier, loading, isActive };
}
