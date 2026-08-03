import { useCallback, useEffect, useState } from "react";

/** Canlı duruşma bildirim türleri. */
export type HearingNotificationKey = "BEYAN" | "ITIRAZ" | "DELIL" | "KARAR";

export type HearingNotificationPrefs = Record<HearingNotificationKey, boolean> & {
  muted: boolean;
};

export const NOTIFICATION_ITEMS: { key: HearingNotificationKey; label: string; hint: string }[] = [
  { key: "BEYAN", label: "Yeni beyan", hint: "Taraf ve vekil beyanları" },
  { key: "ITIRAZ", label: "Yeni itiraz", hint: "İtiraz ve karşı çıkışlar" },
  { key: "DELIL", label: "Yeni delil", hint: "Delil sunumu ve dosyaya giren belgeler" },
  { key: "KARAR", label: "Karar tefhimi", hint: "Ara karar ve nihai karar" },
];

const STORAGE_KEY = "hearing-notification-prefs";

const DEFAULTS: HearingNotificationPrefs = {
  muted: false,
  BEYAN: true,
  ITIRAZ: true,
  DELIL: true,
  KARAR: true,
};

function read(): HearingNotificationPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<HearingNotificationPrefs>) };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Kullanıcının duruşma bildirimlerini tür tür açıp kapatmasını sağlar.
 * Tercihler tarayıcıda saklanır; hidrasyon uyuşmazlığı olmaması için mount sonrası okunur.
 */
export function useHearingNotificationPrefs() {
  const [prefs, setPrefs] = useState<HearingNotificationPrefs>(DEFAULTS);

  useEffect(() => {
    setPrefs(read());
  }, []);

  const update = useCallback((patch: Partial<HearingNotificationPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* depolama kapalıysa sessizce geç */
      }
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (key: HearingNotificationKey) => !prefs.muted && prefs[key],
    [prefs],
  );

  const activeCount = NOTIFICATION_ITEMS.filter((i) => prefs[i.key]).length;

  return { prefs, update, isEnabled, activeCount };
}
