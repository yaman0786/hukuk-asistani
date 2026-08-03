import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LiveTurn } from "@/lib/hearing-room.functions";

/**
 * Duruşma odasındaki yeni söz kayıtlarını ve katılımcı değişikliklerini anlık dinler.
 * Kanal, bileşen kaldırıldığında veya duruşma değiştiğinde kapatılır.
 */
export function useHearingRealtime(
  hearingId: string | null,
  handlers: {
    onTurn: (turn: LiveTurn) => void;
    onParticipant?: () => void;
    onVerdict?: (verdict: string) => void;
  },
) {
  const { onTurn, onParticipant, onVerdict } = handlers;

  useEffect(() => {
    if (!hearingId) return;

    const channel = supabase
      .channel(`hearing:${hearingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hearing_turns",
          filter: `hearing_id=eq.${hearingId}`,
        },
        (payload) => onTurn(payload.new as LiveTurn),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hearing_participants",
          filter: `hearing_id=eq.${hearingId}`,
        },
        () => onParticipant?.(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hearings",
          filter: `id=eq.${hearingId}`,
        },
        (payload) => {
          const verdict = (payload.new as { verdict?: string | null }).verdict;
          if (verdict) onVerdict?.(verdict);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hearingId, onTurn, onParticipant, onVerdict]);
}
