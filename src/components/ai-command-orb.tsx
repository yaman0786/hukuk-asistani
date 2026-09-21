import { useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Clock3,
  FileSearch,
  FileText,
  Gavel,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createThread, listThreads } from "@/lib/threads.functions";
import "./ai-command-orb.css";

type AiAction = {
  title: string;
  subtitle: string;
  icon: typeof Bot;
  prompt: string;
};

const ACTIONS: AiAction[] = [
  {
    title: "Dosya Analizi",
    subtitle: "Belge, delil ve risk haritası",
    icon: FileSearch,
    prompt:
      "Dosyamı profesyonel biçimde analiz et. Önce olayın kısa kronolojisini ve elimdeki belgeleri sor. Sonra güçlü/zayıf delilleri, süre risklerini, görev-yetkiyi ve en güvenli hukuki yolu kaynak doğrulamasıyla çıkar.",
  },
  {
    title: "Dilekçe Hazırla",
    subtitle: "Kullanıma hazır mahkeme dili",
    icon: FileText,
    prompt:
      "Benim için doğrudan kullanılabilir bir hukuki dilekçe hazırlamama yardım et. Önce dilekçe türünü, mahkeme/merciyi, tarafları, dosya numarasını, kronolojiyi ve delilleri sor. Vermediğim bilgileri uydurma.",
  },
  {
    title: "Mevzuat Ara",
    subtitle: "Doğrulanmış madde ve yürürlük",
    icon: Search,
    prompt:
      "Mevzuat araştırması yapmak istiyorum. Konuyu benden al. Güncel hüküm ile olay tarihindeki hükmü ayır; doğrulanamayan madde, süre veya parasal sınır için kesin ifade kullanma.",
  },
  {
    title: "İçtihat Bul",
    subtitle: "Yargıtay, AYM, Danıştay",
    icon: Gavel,
    prompt:
      "Somut olayıma benzer içtihatları araştır. Konuyu benden al. Karar kimliğini doğrulamadan E/K numarası üretme; lehe ve aleyhe içtihatları ayrı göster ve benzerlik düzeyini açıkla.",
  },
  {
    title: "Süre Hesapla",
    subtitle: "Tebliğ ve son gün kontrolü",
    icon: Clock3,
    prompt:
      "Bir hukuki süreyi hesaplamak istiyorum. Önce işlem türünü, tebliğ/öğrenme tarihini, ilgili merciyi ve gerekiyorsa tatil bilgilerini benden iste. Hesabı adım adım ve dayanakla göster.",
  },
  {
    title: "Strateji Kur",
    subtitle: "En güvenli yol haritası",
    icon: Sparkles,
    prompt:
      "Uyuşmazlığım için profesyonel hukuki strateji kur. Önce eksik kritik bilgileri sor; sonra seçenekleri hız, maliyet, delil gücü, süre riski ve icra kabiliyeti açısından karşılaştır. En güvenli yolu açıkça işaretle.",
  },
];

export function AiCommandOrb() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const compact = useMemo(() => pathname.startsWith("/chat/"), [pathname]);

  async function launch(action?: AiAction) {
    setBusy(action?.title ?? "Asistan");
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (action) {
          try {
            sessionStorage.setItem("autosend:pending", action.prompt);
          } catch {
            // sessionStorage unavailable: auth still works, user can type manually.
          }
        }
        await navigate({ to: "/auth", search: { next: "/" } });
        return;
      }

      const threads = await listThreads();
      let thread = (threads ?? []).find((t) => !t.archived) ?? threads?.[0];
      if (!thread) thread = await createThread();

      if (action) {
        try {
          sessionStorage.setItem(`autosend:${thread.id}`, action.prompt);
        } catch {
          // non-fatal
        }
      }

      setOpen(false);
      await navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`hukuk-ai-orb-root ${compact ? "is-chat" : ""}`}>
      {open && (
        <div className="hukuk-ai-panel" role="dialog" aria-modal="false" aria-label="Hukuk AI hızlı işlemler">
          <div className="hukuk-ai-panel-head">
            <div className="hukuk-ai-avatar small" aria-hidden>
              <span className="hukuk-ai-avatar-ring" />
              <Bot className="hukuk-ai-bot-icon" />
            </div>
            <div className="hukuk-ai-head-copy">
              <div className="hukuk-ai-kicker"><span className="hukuk-ai-live-dot" /> HUKUK AI AKTİF</div>
              <div className="hukuk-ai-title">Nasıl yardımcı olayım?</div>
              <div className="hukuk-ai-subtitle">Araştırma, dosya, dilekçe ve strateji tek merkezde.</div>
            </div>
            <button className="hukuk-ai-close" onClick={() => setOpen(false)} aria-label="Hukuk AI panelini kapat">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="hukuk-ai-action-grid">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const loading = busy === action.title;
              return (
                <button
                  key={action.title}
                  type="button"
                  className="hukuk-ai-action"
                  disabled={!!busy}
                  onClick={() => void launch(action)}
                >
                  <span className="hukuk-ai-action-icon"><Icon className="h-4 w-4" /></span>
                  <span className="hukuk-ai-action-copy">
                    <strong>{loading ? "Hazırlanıyor…" : action.title}</strong>
                    <small>{action.subtitle}</small>
                  </span>
                  <ArrowRight className="hukuk-ai-arrow h-4 w-4" />
                </button>
              );
            })}
          </div>

          <button className="hukuk-ai-primary" disabled={!!busy} onClick={() => void launch()}>
            <Sparkles className="h-4 w-4" />
            {busy === "Asistan" ? "Asistan açılıyor…" : "Hukuk AI ile konuş"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        type="button"
        className="hukuk-ai-orb"
        aria-label="Hukuk AI asistanını aç"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hukuk-ai-orb-halo halo-one" />
        <span className="hukuk-ai-orb-halo halo-two" />
        <span className="hukuk-ai-avatar" aria-hidden>
          <span className="hukuk-ai-avatar-ring" />
          <Bot className="hukuk-ai-bot-icon" />
          <span className="hukuk-ai-spark"><Sparkles className="h-3 w-3" /></span>
        </span>
        <span className="hukuk-ai-orb-copy">
          <strong>Hukuk AI</strong>
          <small><span className="hukuk-ai-live-dot" /> Hazır</small>
        </span>
      </button>
    </div>
  );
}
