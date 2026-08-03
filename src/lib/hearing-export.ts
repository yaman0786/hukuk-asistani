/** Duruşma tutanağını resmî görünümlü metne çevirip indirir. */

export type ExportTurn = {
  speaker: string;
  role: string;
  action?: string | null;
  text: string;
  created_at?: string;
};

export type ExportMeta = {
  title: string;
  court: string;
  caseType: string;
  code?: string;
  parties?: string[];
  evidence?: string[];
  participants?: string[];
};

function stamp(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("tr-TR");
  } catch {
    return "";
  }
}

export function buildTranscriptMarkdown(
  meta: ExportMeta,
  turns: ExportTurn[],
  verdict?: string,
): string {
  const lines: string[] = [];
  lines.push(`# DURUŞMA TUTANAĞI (SİMÜLASYON)`);
  lines.push("");
  lines.push(`**Dosya:** ${meta.title}`);
  if (meta.court) lines.push(`**Mahkeme:** ${meta.court}`);
  lines.push(`**Dava türü:** ${meta.caseType}`);
  if (meta.code) lines.push(`**Duruşma kodu:** ${meta.code}`);
  lines.push(`**Tutanak tarihi:** ${new Date().toLocaleString("tr-TR")}`);
  if (meta.participants?.length) lines.push(`**Salondakiler:** ${meta.participants.join(", ")}`);
  if (meta.parties?.length) lines.push(`**Taraflar:** ${meta.parties.join(", ")}`);
  if (meta.evidence?.length) lines.push(`**Deliller:** ${meta.evidence.join(", ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  turns.forEach((t, i) => {
    const at = stamp(t.created_at);
    lines.push(
      `**${i + 1}. ${t.speaker || t.role}**${t.action ? ` — ${t.action}` : ""}${at ? ` _(${at})_` : ""}`,
    );
    lines.push("");
    lines.push(t.text);
    lines.push("");
  });

  if (verdict) {
    lines.push("---");
    lines.push("");
    lines.push(verdict);
    lines.push("");
  }

  lines.push("---");
  lines.push(
    "_Bu belge bir yapay zekâ duruşma simülasyonunun çıktısıdır; resmî bir mahkeme tutanağı veya kararı değildir._",
  );
  return lines.join("\n");
}

export function downloadText(filename: string, content: string, mime = "text/markdown") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugifyFilename(input: string): string {
  const map: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o",
    ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return (
    input
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] ?? m)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "durusma"
  );
}
