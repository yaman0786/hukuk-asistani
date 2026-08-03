import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type CourtroomRole =
  | "HAKIM"
  | "SAVCI"
  | "DAVACI_VEKILI"
  | "DAVALI_VEKILI"
  | "MUDAFI"
  | "BILIRKISI"
  | "KATIP"
  | "TARAF";

export type HearingTurn = {
  role: CourtroomRole;
  speaker: string;
  text: string;
};

export type HearingSetup = {
  title: string;
  court: string;
  caseType: string;
  parties: string[];
  evidence: string[];
  missing: string[];
};

const READABLE = /^(application\/pdf|image\/(png|jpe?g|webp|heic|heif))$/i;

export const MODEL_ID = "google/gemini-3.6-flash";

export const CASE_TYPE_LABEL: Record<string, string> = {
  HUKUK: "Hukuk (asliye/sulh)",
  CEZA: "Ceza",
  IS: "İş",
  AILE: "Aile",
  IDARE: "İdare",
  ICRA: "İcra hukuku",
  TUKETICI: "Tüketici",
};

export {
  USER_ROLE_LABEL,
  ACTION_LABEL,
  ACTION_HINT,
  ROLE_PERMISSIONS,
  canPerform,
  assertCourtAction,
  type CourtAction,
} from "@/lib/courtroom-roles";




export const BASE_RULES = `Sen Türk yargı sisteminde geçen gerçekçi bir DURUŞMA SİMÜLASYONU yönetiyorsun.

MUTLAK KURALLAR:
- Yalnızca kullanıcının yüklediği belgelere ve beyanına dayan. Belgede/beyanda olmayan olay, tarih, tutar, taraf veya delil UYDURMA.
- Sahte esas/karar numarası, sahte mahkeme adı, sahte Yargıtay kararı üretme. Gerçek mevzuat maddesine atıf yapacaksan yalnızca emin olduğun maddeyi yaz; emin değilsen madde numarası verme.
- Bilgi eksikse konuşmacı bunu duruşmada açıkça sorsun ("dosyada bu husus yok, beyan ediniz").
- Türk usul hukukuna uygun, ölçülü ve resmî duruşma dili kullan. Dram/abartı yok, film repliği yok.
- Bu bir simülasyondur; taraflara gerçek bir yargı kararı vaadi verme.

ÇIKTI: Sadece geçerli JSON döndür, kod bloğu veya açıklama ekleme.`;

export function extractJson<T>(raw: string): T | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

type SupabaseLike = {
  from: (t: string) => any;
  storage: { from: (b: string) => any };
};

/** Dava dosyasını (varsa PDF/görsel eki dahil) modele verilecek parçalara dönüştürür. */
export async function buildCaseParts(
  supabase: SupabaseLike,
  caseFileId: string | undefined,
): Promise<{ parts: Array<Record<string, unknown>>; label: string }> {
  if (!caseFileId) return { parts: [], label: "" };

  const { data: f } = await supabase
    .from("case_files")
    .select("id,title,storage_path,mime,uyap_no,court,extracted_text")
    .eq("id", caseFileId)
    .maybeSingle();
  if (!f) return { parts: [], label: "" };

  const parts: Array<Record<string, unknown>> = [];
  if (f.mime && READABLE.test(f.mime)) {
    try {
      const { data: blob } = await supabase.storage.from("case-files").download(f.storage_path);
      if (blob) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        if (buf.byteLength > 0 && buf.byteLength <= 15 * 1024 * 1024) {
          parts.push({ type: "file", data: buf, mediaType: f.mime });
        }
      }
    } catch (e) {
      console.error("courtroom: case file download failed", caseFileId, e);
    }
  }

  const label = `Dosya başlığı: ${f.title}${f.uyap_no ? `\nUYAP No: ${f.uyap_no}` : ""}${
    f.court ? `\nMahkeme: ${f.court}` : ""
  }${f.extracted_text ? `\nKullanıcı notları:\n${String(f.extracted_text).slice(0, 12000)}` : ""}${
    parts.length ? "\n(Dava belgesi ektedir, oku.)" : ""
  }`;

  return { parts, label };
}

export async function callModel(
  apiKey: string,
  prompt: string,
  extraParts: Array<Record<string, unknown>> = [],
): Promise<string> {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const model = gateway(MODEL_ID);
  const content = [{ type: "text", text: prompt }, ...extraParts];
  const { text } = await generateText({
    model,
    messages: [{ role: "user", content: content as never }],
  });
  return text;
}

export function transcriptToText(turns: HearingTurn[]): string {
  return turns.map((t) => `${t.speaker}: ${t.text}`).join("\n\n");
}
