import { BookOpen, ExternalLink, Info } from "lucide-react";
import { extractCitations } from "@/lib/citations";

export function CitationsList({ text }: { text: string }) {
  const citations = extractCitations(text);
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        <BookOpen className="w-3 h-3" />
        Referanslar ({citations.length})
      </div>
      <ul className="space-y-1">
        {citations.map((c, i) => (
          <li key={i} className="text-xs">
            {c.href ? (
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-primary transition"
              >
                <span
                  className={
                    "text-[9px] uppercase font-medium px-1.5 py-0.5 rounded " +
                    (c.kind === "ictihat"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent text-foreground/70")
                  }
                >
                  {c.kind === "ictihat" ? "Resmî içtihat" : "Resmî mevzuat"}
                </span>
                {c.label}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground italic">
                <Info className="w-3 h-3" />
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
