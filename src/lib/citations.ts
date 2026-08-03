// Extract [Kaynak: ...] citation markers from an assistant message and
// build searchable links to Turkish official legal databases.

export interface Citation {
  raw: string;
  kind: "mevzuat" | "ictihat" | "genel";
  label: string;
  href?: string;
}

const MEVZUAT_BASE = "https://www.google.com/search?q=";
const KARAR_BASE = "https://karararama.yargitay.gov.tr/";

/** Parse all `[Kaynak: ...]` and `[Genel İlke]` markers from text. */
export function extractCitations(text: string): Citation[] {
  const results: Citation[] = [];
  const seen = new Set<string>();

  // [Genel İlke]
  const generalRe = /\[Genel İlke\]/g;
  if (generalRe.test(text)) {
    results.push({
      raw: "[Genel İlke]",
      kind: "genel",
      label: "Genel hukuk ilkesi (belirli kaynak gösterilmemiş)",
    });
    seen.add("[Genel İlke]");
  }

  // [Kaynak: ...]
  const re = /\[Kaynak:\s*([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const inner = m[1].trim();
    if (seen.has(raw)) continue;
    seen.add(raw);

    // Ictihat pattern: contains E.YIL/NO K.YIL/NO
    const isIctihat = /E\.\s*\d{2,4}\s*\/\s*\d+/i.test(inner);
    if (isIctihat) {
      results.push({
        raw,
        kind: "ictihat",
        label: inner,
        href: KARAR_BASE + "#" + encodeURIComponent(inner),
      });
    } else {
      results.push({
        raw,
        kind: "mevzuat",
        label: inner,
        href: MEVZUAT_BASE + encodeURIComponent(`mevzuat.gov.tr ${inner}`),
      });
    }
  }
  return results;
}
