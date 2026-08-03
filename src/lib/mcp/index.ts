import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listThreadsTool from "./tools/list-threads";
import getThreadMessagesTool from "./tools/get-thread-messages";
import createThreadTool from "./tools/create-thread";
import renameThreadTool from "./tools/rename-thread";
import deleteThreadTool from "./tools/delete-thread";

// OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
// VITE_SUPABASE_PROJECT_ID is inlined at build time by Vite; the sentinel
// keeps the URL well-formed during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "hukuk-master-ai-mcp",
  title: "Türkiye Hukuk Master AI",
  version: "0.1.0",
  instructions:
    "Türkiye Hukuk Master AI kullanıcısının kendi sohbet dosyalarını (davalar/dosyalar) listeleyip okuyabilir, yeni dosya oluşturabilir, yeniden adlandırabilir veya silebilir. Tüm işlemler giriş yapan kullanıcı adına yapılır; başka bir kullanıcının verisine erişilemez.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listThreadsTool,
    getThreadMessagesTool,
    createThreadTool,
    renameThreadTool,
    deleteThreadTool,
  ],
});
