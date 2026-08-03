import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toggleTheme } from "@/lib/theme";
import { Search, Plus, MessageSquare, Moon, LogOut, Scale } from "lucide-react";

interface Thread {
  id: string;
  title: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  threads: Thread[];
  onNewThread: () => void;
}

export function CommandPalette({ open, onClose, threads, onNewThread }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setIdx(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    const actions = [
      {
        id: "new",
        label: "Yeni Dosya Aç",
        icon: Plus,
        run: () => {
          onNewThread();
          onClose();
        },
      },
      {
        id: "theme",
        label: "Karanlık modu değiştir",
        icon: Moon,
        run: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: "signout",
        label: "Çıkış Yap",
        icon: LogOut,
        run: async () => {
          await supabase.auth.signOut();
          navigate({ to: "/auth" });
          onClose();
        },
      },
    ];
    const threadItems = threads
      .filter((t) => !s || t.title.toLocaleLowerCase("tr").includes(s))
      .slice(0, 10)
      .map((t) => ({
        id: "t-" + t.id,
        label: t.title,
        icon: MessageSquare,
        run: () => {
          navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
          onClose();
        },
      }));
    const filteredActions = s
      ? actions.filter((a) => a.label.toLocaleLowerCase("tr").includes(s))
      : actions;
    return [...filteredActions, ...threadItems];
  }, [q, threads, navigate, onClose, onNewThread]);

  useEffect(() => {
    if (idx >= results.length) setIdx(Math.max(0, results.length - 1));
  }, [results.length, idx]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] px-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <Scale className="w-4 h-4 text-primary" />
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                results[idx]?.run();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Ara veya komut çalıştır..."
            className="flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">Sonuç yok</div>
          )}
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onMouseEnter={() => setIdx(i)}
                onClick={r.run}
                className={
                  "w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition " +
                  (i === idx ? "bg-accent text-accent-foreground" : "text-foreground/85")
                }
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="truncate flex-1">{r.label}</span>
              </button>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground flex gap-3 justify-end">
          <span>↑↓ gez</span>
          <span>↵ seç</span>
          <span>⌘K aç</span>
        </div>
      </div>
    </div>
  );
}
