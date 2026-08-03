import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  NOTIFICATION_ITEMS,
  type HearingNotificationPrefs,
} from "@/hooks/useHearingNotificationPrefs";

/** Duruşma bildirimlerini tür bazında açıp kapatan ayar menüsü. */
export function HearingNotificationSettings({
  prefs,
  update,
  activeCount,
}: {
  prefs: HearingNotificationPrefs;
  update: (patch: Partial<HearingNotificationPrefs>) => void;
  activeCount: number;
}) {
  const off = prefs.muted || activeCount === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" title="Bildirim ayarları">
          {off ? <BellOff className="size-4" /> : <Bell className="size-4" />}
          <span className="hidden sm:inline">Bildirimler</span>
          <span className="text-xs text-muted-foreground">
            {prefs.muted ? "kapalı" : `${activeCount}/${NOTIFICATION_ITEMS.length}`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-medium">Anlık bildirimler</p>
          <p className="text-xs text-muted-foreground">
            Hangi duruşma hareketlerinde bildirim almak istediğinizi seçin.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <Label htmlFor="notif-mute" className="text-sm">
            Tümünü sustur
          </Label>
          <Switch
            id="notif-mute"
            checked={prefs.muted}
            onCheckedChange={(v) => update({ muted: v })}
          />
        </div>

        <div className="space-y-2.5">
          {NOTIFICATION_ITEMS.map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-3">
              <div className={prefs.muted ? "opacity-50" : undefined}>
                <Label htmlFor={`notif-${item.key}`} className="text-sm">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <Switch
                id={`notif-${item.key}`}
                disabled={prefs.muted}
                checked={prefs[item.key]}
                onCheckedChange={(v) => update({ [item.key]: v })}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
