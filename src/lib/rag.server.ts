// Server-only RAG helpers. Never import from client code.
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export async function embedText(text: string): Promise<number[] | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${GATEWAY}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-embedding-001",
        input: text.slice(0, 6000),
      }),
    });
    if (!res.ok) {
      console.error("embed failed", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    return json.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("embed error", e);
    return null;
  }
}

export type LegalMatch = {
  id: string;
  code: string;
  article_no: string | null;
  title: string;
  content: string;
  ref: string | null;
  similarity: number;
};

export async function matchLegalDocuments(query: string, matchCount = 6): Promise<LegalMatch[]> {
  const embedding = await embedText(query);
  if (!embedding) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("match_legal_documents", {
    query_embedding: embedding as unknown as string,
    match_count: matchCount,
  });
  if (error) {
    console.error("match_legal_documents error", error);
    return [];
  }
  return (data ?? []) as LegalMatch[];
}

export function buildRagContext(matches: LegalMatch[]): string {
  if (matches.length === 0) return "";
  const lines = matches.map(
    (m) =>
      `[${m.code}${m.article_no ? " " + m.article_no : ""}] ${m.title}\n${m.content.slice(0, 800)}`,
  );
  return `\n\n---\nİLGİLİ MEVZUAT (retrieval — kaynak olarak aktif kullan):\n${lines.join("\n\n")}\n---\n`;
}
