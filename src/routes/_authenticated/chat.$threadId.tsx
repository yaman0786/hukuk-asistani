import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listThreads,
  createThread,
  deleteThread,
  renameThread,
  setThreadFlags,
  getThreadMessages,
  getUsage,
  exportMyData,
  deleteMyAccount,
} from "@/lib/threads.functions";
import { listFolders, createFolder, deleteFolder, setThreadFolder } from "@/lib/folders.functions";
import { submitFeedback, getFeedbackForMessages } from "@/lib/feedback.functions";
import { createShare } from "@/lib/shares.functions";
import {
  listPersonalizedUpdates,
  listDailyUpdates,
  fetchUpdateSource,
  type DailyUpdate,
} from "@/lib/daily-updates.functions";
import { isAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { VoiceInputButton } from "@/components/voice-input-button";
import { Shimmer } from "@/components/ai-elements/shimmer";

import { ThemeToggle } from "@/components/theme-toggle";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import { CommandPalette } from "@/components/command-palette";
import { OnboardingTour } from "@/components/onboarding-tour";
import { CitationsList } from "@/components/citations-list";
import { CaseFilesPanel } from "@/components/case-files-panel";

import {
  Menu,
  Plus,
  Trash2,
  LogOut,
  Scale,
  Search,
  Pencil,
  Copy,
  RefreshCw,
  Download,
  ShieldAlert,
  Paperclip,
  X,
  FileText,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Command,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Shield,
  Folder,
  FolderPlus,
  Quote,
  Home,
  LayoutTemplate,
  ExternalLink,
  Landmark,
  Gavel,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { toast } from "sonner";
import { exportPdf, exportDocx, exportMarkdown } from "@/lib/export-message";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Sohbet — Hukuk Asistanı" },
      {
        name: "description",
        content: "Mevzuat, içtihat, delil ve dilekçe için profesyonel Türkçe hukuki AI asistan.",
      },
      { property: "og:title", content: "Hukuki Sohbet — Hukuk Asistanı" },
      {
        property: "og:description",
        content:
          "Dosyanızı açın, sorununuzu yazın; mevzuat, içtihat ve dilekçe önerileriyle birlikte çalışın.",
      },
    ],
  }),
  component: ChatPage,
});

// Not: Rastgele örnek sorular kaldırıldı. Karşılama ekranında yalnızca
// kullanıcının konusunu seçtiği yapılandırılmış "İhtiyaç seçici" (NEEDS)
// gösteriliyor; böylece öneriler her zaman kullanıcının seçtiği alana özel
// ve profesyonel bir çerçevede kalıyor.

const GREETINGS = [
  "Merhaba, ben Hukuk Asistanınız 👋",
  "Dosyanızı birlikte inceleyelim.",
  "Hukuki sorununuzu ayrıntılı yazın, en güvenli yolu birlikte bulalım.",
  "Nereden başlamak istersiniz?",
  "Süre kaybetmeden önce planı birlikte kuralım.",
];

// İhtiyaç seçici — kullanıcı hukuki alanı seçtiğinde anında öneri ve ilgili
// şablonlara yönlendirme yapar. `kind` değeri /sablonlar?kategori=<kind>
// parametresiyle eşleşir, böylece tek tıkla o alanın şablon listesine gider.
type Need = {
  kind: string;
  label: string;
  emoji: string;
  intro: string;
  suggestions: string[];
};
const NEEDS: Need[] = [
  {
    kind: "aile",
    label: "Aile & Boşanma",
    emoji: "👨‍👩‍👧",
    intro: "Boşanma, velayet, nafaka ve mal paylaşımı süreçleri.",
    suggestions: [
      "Anlaşmalı boşanma protokolü hazırlamama yardım et",
      "Velayetin bende kalması için hangi delilleri toplamalıyım?",
      "Nafaka artırım davası nasıl açılır, süreç ne kadar sürer?",
    ],
  },
  {
    kind: "is",
    label: "İş Hukuku",
    emoji: "💼",
    intro: "İşe iade, kıdem/ihbar tazminatı, mobbing ve fazla mesai.",
    suggestions: [
      "Haksız fesih için işe iade davası dilekçesi hazırla",
      "Kıdem ve ihbar tazminatımı nasıl hesaplarım?",
      "İş yerinde mobbinge uğradım, tazminat davası açabilir miyim?",
    ],
  },
  {
    kind: "kira",
    label: "Kira & Gayrimenkul",
    emoji: "🏠",
    intro: "Tahliye, kira tespit, depozito iadesi ve tapu uyuşmazlıkları.",
    suggestions: [
      "Kiracım 3 aydır ödemiyor, tahliye için hangi yolu izlemeliyim?",
      "Kira bedelinin tespiti davası nasıl açılır?",
      "Depozitomu iade etmeyen ev sahibine karşı ne yapabilirim?",
    ],
  },
  {
    kind: "icra",
    label: "İcra & Alacak",
    emoji: "⚖️",
    intro: "İlamsız/ilamlı takip, itirazın iptali, haciz ve bloke.",
    suggestions: [
      "İlamsız icra takibi başlatmak için dilekçe hazırla",
      "Ödeme emrine itirazın iptali davası cevap dilekçesi",
      "Maaş hesabıma bloke konuldu, itiraz süreci nasıl işler?",
    ],
  },
  {
    kind: "tuketici",
    label: "Tüketici",
    emoji: "🛒",
    intro: "Ayıplı ürün, hakem heyeti, cayma ve mesafeli sözleşme.",
    suggestions: [
      "İnternetten aldığım ürün ayıplı çıktı, haklarım nelerdir?",
      "Tüketici hakem heyetine başvuru dilekçesi hazırla",
      "Mesafeli satışta cayma hakkımı nasıl kullanırım?",
    ],
  },
  {
    kind: "ceza",
    label: "Ceza",
    emoji: "🛡️",
    intro: "Şikayet, müşteki katılma, savunma ve itiraz süreçleri.",
    suggestions: [
      "Hakaret suçundan şikayet dilekçesi hazırla",
      "Müşteki olarak davaya katılma dilekçesi örneği ver",
      "İfade vermeye çağırıldım, avukatsız gitmemin riskleri neler?",
    ],
  },
  {
    kind: "tazminat",
    label: "Tazminat",
    emoji: "🚗",
    intro: "Trafik kazası, iş kazası, maddi ve manevi tazminat.",
    suggestions: [
      "Trafik kazası sonrası sigorta ödemiyor, ne yapabilirim?",
      "İş kazasından doğan maddi/manevi tazminat davası nasıl açılır?",
      "Manevi tazminat miktarı nasıl belirlenir?",
    ],
  },
  {
    kind: "miras",
    label: "Miras",
    emoji: "📜",
    intro: "Veraset, tenkis, mirasın reddi ve izale-i şuyu.",
    suggestions: [
      "Kardeşim tapu devretmiyor, izale-i şuyu davası nasıl açılır?",
      "Mirasın reddi için süre ve prosedür nedir?",
      "Saklı pay tenkis davası ne zaman açılır?",
    ],
  },
  {
    kind: "kisisel-veri",
    label: "KVKK & Kişisel Veri",
    emoji: "🔐",
    intro: "Veri ihlali, silme talebi, KVKK başvuru ve şikayet.",
    suggestions: [
      "Verilerimin silinmesi için KVKK başvuru dilekçesi hazırla",
      "İzinsiz SMS/aramaya karşı KVKK şikayeti nasıl yapılır?",
      "Veri sorumlusunun 30 günlük yanıt süresi doldu, ne yapmalıyım?",
    ],
  },
  {
    kind: "idari",
    label: "İdari",
    emoji: "🏛️",
    intro: "İdari işlem iptali, idari para cezası ve tam yargı.",
    suggestions: [
      "İdari para cezasına itiraz dilekçesi hazırla",
      "İdari işlemin iptali davası için süre ne kadar?",
      "Tam yargı davasında hangi zararlar talep edilebilir?",
    ],
  },
];

function ChatPage() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "archived">("all");
  const [folderFilter, setFolderFilter] = useState<string | null>(null); // folder id, "none" for unassigned, null = all
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const cancelSavedRef = useRef(false);

  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const renameFn = useServerFn(renameThread);
  const flagsFn = useServerFn(setThreadFlags);
  const getMsgsFn = useServerFn(getThreadMessages);
  const getUsageFn = useServerFn(getUsage);
  const exportFn = useServerFn(exportMyData);
  const deleteAccountFn = useServerFn(deleteMyAccount);
  const feedbackFn = useServerFn(submitFeedback);
  const getFeedbackFn = useServerFn(getFeedbackForMessages);
  const shareFn = useServerFn(createShare);
  const isAdminFn = useServerFn(isAdmin);
  const listFoldersFn = useServerFn(listFolders);
  const createFolderFn = useServerFn(createFolder);
  const deleteFolderFn = useServerFn(deleteFolder);
  const setThreadFolderFn = useServerFn(setThreadFolder);

  const threadsQ = useQuery({ queryKey: ["threads"], queryFn: () => listFn() });
  const foldersQ = useQuery({ queryKey: ["folders"], queryFn: () => listFoldersFn() });
  const messagesQ = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getMsgsFn({ data: { threadId } }),
  });
  const usageQ = useQuery({
    queryKey: ["usage"],
    queryFn: () => getUsageFn(),
    refetchInterval: 60_000,
  });
  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn() });
  const personalizedFn = useServerFn(listPersonalizedUpdates);
  const personalizedQ = useQuery({
    queryKey: ["personalized-updates"],
    queryFn: () => personalizedFn(),
    staleTime: 5 * 60 * 1000,
  });
  const [feedbackMap, setFeedbackMap] = useState<Record<string, number>>({});

  const initial = (messagesQ.data ?? []) as unknown as UIMessage[];

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    id: threadId,
    messages: initial,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: async ({ messages, id }) => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const { getPaddleEnvironment } = await import("@/lib/paddle");
        const headers: Record<string, string> = { "x-paddle-env": getPaddleEnvironment() };
        if (token) headers.Authorization = `Bearer ${token}`;
        return {
          body: { messages, threadId: id },
          headers,
        };
      },
    }),
    onError: (e) => toast.error(e.message || "Bir hata oluştu"),
    onFinish: async ({ message, isAbort }: { message?: UIMessage; isAbort?: boolean }) => {
      if (isAbort && message && !cancelSavedRef.current) {
        cancelSavedRef.current = true;
        try {
          const parts = (message.parts ?? []).map((p) => ({ ...p })) as UIMessage["parts"];
          let lastTextIdx = -1;
          parts.forEach((p, i) => {
            if (p.type === "text") lastTextIdx = i;
          });
          if (lastTextIdx >= 0) {
            const t = parts[lastTextIdx] as { type: "text"; text: string };
            t.text = `${t.text}\n\n_Durduruldu._`;
          } else {
            parts.push({ type: "text", text: "_Durduruldu._" } as never);
          }
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userData.user.id,
              role: "assistant",
              parts: parts as never,
            });
          }
        } catch (err) {
          console.error("client-side abort persistence failed", err);
        }
      }
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["usage"] });
    },
  });

  // Load per-user feedback for currently visible assistant messages.
  useEffect(() => {
    const assistantIds =
      messagesQ.data?.filter((m) => m.role === "assistant").map((m) => m.id) ?? [];
    if (assistantIds.length === 0) {
      setFeedbackMap({});
      return;
    }
    getFeedbackFn({ data: { messageIds: assistantIds } })
      .then((res) => setFeedbackMap(res))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesQ.data]);

  // Auto-send a template-generated prompt handed over via sessionStorage
  // so the dilekçe content is actually generated and streamed on screen.
  const autoSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!messagesQ.isSuccess) return;
    if (autoSentRef.current === threadId) return;
    if ((messagesQ.data ?? []).length > 0) return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(`autosend:${threadId}`);
    } catch {
      pending = null;
    }
    if (!pending) return;
    autoSentRef.current = threadId;
    try {
      sessionStorage.removeItem(`autosend:${threadId}`);
    } catch {
      // ignore
    }
    sendMessage({ text: pending });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, messagesQ.isSuccess, messagesQ.data]);

  async function handleFeedback(messageId: string, rating: 1 | -1) {
    let reason: string | undefined;
    if (rating === -1) {
      const r = window.prompt("Bu cevaptaki sorunu kısaca yazar mısınız? (opsiyonel)");
      reason = r?.trim() || undefined;
    }
    try {
      await feedbackFn({ data: { messageId, rating, reason } });
      setFeedbackMap((p) => ({ ...p, [messageId]: rating }));
      toast.success(rating === 1 ? "Teşekkürler!" : "Geri bildirim alındı.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleShareThread() {
    try {
      const { token } = await shareFn({ data: { threadId, days: 30 } });
      const url = `${window.location.origin}/paylas/${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Paylaşım linki oluşturuldu (30 gün) ve panoya kopyalandı.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Reset cancel guard when a new turn starts.
  if ((status === "submitted" || status === "streaming") && cancelSavedRef.current) {
    cancelSavedRef.current = false;
  }

  async function handleSubmit(message: PromptInputMessage) {
    const hasText = !!message.text?.trim();
    const hasFiles = (message.files?.length ?? 0) > 0;
    if (!hasText && !hasFiles) return;
    if (status === "streaming" || status === "submitted") return;
    await sendMessage({
      text: message.text?.trim() ?? "",
      files: message.files ?? [],
    });
  }

  async function handleQuickPrompt(text: string) {
    if (status === "streaming" || status === "submitted") return;
    await sendMessage({ text });
  }

  async function handleNewThread() {
    const t = await createFn();
    qc.invalidateQueries({ queryKey: ["threads"] });
    setSidebarOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;
    await deleteFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["threads"] });
    if (id === threadId) {
      const remaining = (threadsQ.data ?? []).filter((t) => t.id !== id);
      if (remaining[0]) {
        navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
      } else {
        // Son dosya silindiğinde otomatik yeni dosya açma — kullanıcı ana sayfaya döner.
        navigate({ to: "/" });
      }
    }
  }

  async function handleRename(id: string, currentTitle: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const next = window.prompt("Yeni başlık:", currentTitle);
    if (!next || next.trim() === "" || next === currentTitle) return;
    try {
      await renameFn({ data: { id, title: next.trim() } });
      qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleTogglePin(id: string, pinned: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await flagsFn({ data: { id, pinned: !pinned } });
      qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleToggleArchive(id: string, archived: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await flagsFn({ data: { id, archived: !archived } });
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success(archived ? "Arşivden çıkarıldı" : "Arşivlendi");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kopyalandı");
    } catch {
      toast.error("Kopyalanamadı");
    }
  }

  async function handleRegenerate(assistantId: string) {
    if (status === "streaming" || status === "submitted") return;
    // Find the user message right before this assistant message.
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx <= 0) return;
    const prevUser = [...messages.slice(0, idx)].reverse().find((m) => m.role === "user");
    if (!prevUser) return;
    const prevText = prevUser.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    if (!prevText) return;
    // Drop the previous assistant message from UI (server row stays; new one appends).
    setMessages(messages.slice(0, idx));
    await sendMessage({ text: prevText });
  }

  async function handleExport() {
    try {
      const data = await exportFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hukuk-ai-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Verileriniz indirildi");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function handleExportThread(format: "pdf" | "docx" | "md") {
    const title = threadsQ.data?.find((t) => t.id === threadId)?.title ?? "Hukuki Danışma";
    const lines: string[] = [];
    for (const m of messages) {
      const text = m.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("")
        .trim();
      if (!text) continue;
      const role = m.role === "user" ? "Kullanıcı" : m.role === "assistant" ? "Asistan" : "Sistem";
      lines.push(`## ${role}\n\n${text}`);
    }
    const body = lines.join("\n\n---\n\n");
    if (!body) {
      toast.error("Dışa aktarılacak içerik yok.");
      return;
    }
    if (format === "pdf") exportPdf(body, title);
    else if (format === "docx") exportDocx(body, title);
    else exportMarkdown(body, title);
  }

  async function handleDeleteAccount() {
    if (!confirm("Hesabınız ve tüm dosyalarınız kalıcı olarak silinecek. Emin misiniz?")) return;
    if (!confirm("Bu işlem GERİ ALINAMAZ. Onaylıyor musunuz?")) return;
    try {
      await deleteAccountFn();
      await supabase.auth.signOut();
      toast.success("Hesabınız silindi");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleCreateFolder() {
    const name = window.prompt("Klasör adı:")?.trim();
    if (!name) return;
    try {
      await createFolderFn({ data: { name } });
      qc.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Klasör oluşturuldu");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDeleteFolder(id: string, name: string) {
    if (!confirm(`"${name}" klasörünü silmek istediğinize emin misiniz? (Dosyalar silinmez.)`))
      return;
    try {
      await deleteFolderFn({ data: { id } });
      if (folderFilter === id) setFolderFilter(null);
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleAssignFolder(threadId: string, folderId: string | null) {
    try {
      await setThreadFolderFn({ data: { threadId, folderId } });
      qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function handleQuote(text: string) {
    const snippet = text.length > 500 ? text.slice(0, 500).trim() + "…" : text.trim();
    const quoted = snippet
      .split("\n")
      .map((l) => "> " + l)
      .join("\n");
    const form = document.querySelector("form");
    const ta = form?.querySelector("textarea") as HTMLTextAreaElement | null;
    if (!ta) return;
    const prefix = ta.value ? ta.value.replace(/\s+$/, "") + "\n\n" : "";
    const next = prefix + quoted + "\n\n";
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(ta, next);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
    ta.setSelectionRange(next.length, next.length);
    ta.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const isLoading = status === "streaming" || status === "submitted";
  const isEmpty = messages.length === 0;

  // Karşılama başlığını her yeni boş sohbet için hafifçe rotasyona sok.
  const rotation = useMemo(() => {
    return {
      greeting: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const filteredThreads = useMemo(() => {
    const s = search.trim().toLocaleLowerCase("tr");
    const all = threadsQ.data ?? [];
    let filtered = all;
    if (filter === "pinned") filtered = all.filter((t) => t.pinned);
    else if (filter === "archived") filtered = all.filter((t) => t.archived);
    else filtered = all.filter((t) => !t.archived);
    if (folderFilter === "none") filtered = filtered.filter((t) => !t.folder_id);
    else if (folderFilter) filtered = filtered.filter((t) => t.folder_id === folderFilter);
    if (s) filtered = filtered.filter((t) => t.title.toLocaleLowerCase("tr").includes(s));
    return filtered;
  }, [threadsQ.data, search, filter, folderFilter]);

  const usage = usageQ.data;
  const hourPct = usage ? Math.min(100, (usage.hourCount / usage.hourLimit) * 100) : 0;
  const dayPct = usage ? Math.min(100, (usage.dayCount / usage.dayLimit) * 100) : 0;

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (mod && e.key === "/") {
        e.preventDefault();
        handleNewThread();
      } else if (e.key === "Escape") {
        if (sidebarOpen) setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen]);

  return (
    <div className="h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <img src="/assets/hukuk-mark.svg" alt="Hukuk Asistanı" width={32} height={32} />
          <div className="flex-1 min-w-0">
            <div className="font-serif text-sm text-sidebar-foreground leading-tight">
              Hukuk Master AI
            </div>
            <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Türkiye
            </div>
          </div>
        </div>
        <div className="p-3 pb-0">
          <Link
            to="/durusma"
            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 text-sm font-medium text-sidebar-foreground transition"
          >
            <Gavel className="w-4 h-4 text-primary" />
            <span className="flex-1 text-left">Sanal Duruşma Salonu</span>
          </Link>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilesOpen((v) => !v)}
              aria-expanded={filesOpen}
              className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sidebar-accent/30 hover:bg-sidebar-accent/60 text-sm font-medium text-sidebar-foreground transition"
            >
              {filesOpen ? (
                <ChevronDown className="w-4 h-4 text-sidebar-foreground/70" />
              ) : (
                <ChevronRight className="w-4 h-4 text-sidebar-foreground/70" />
              )}
              <span className="flex-1 text-left">Dosyalarım</span>
              {(threadsQ.data?.length ?? 0) > 0 && (
                <span className="text-[10px] text-sidebar-foreground/60">
                  {threadsQ.data?.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleNewThread}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
              aria-label="Yeni dosya"
              title="Yeni dosya"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {filesOpen && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Dosyalarda ara..."
                aria-label="Dosyalarda ara"
                className="w-full text-xs pl-8 pr-3 py-2 rounded-md bg-sidebar-accent/40 border border-sidebar-border/60 text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          )}
        </div>
        {filesOpen && (
          <>
            <div className="px-3 pb-2 flex gap-1 text-[10px]">
              {(["all", "pinned", "archived"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    "flex-1 px-2 py-1.5 rounded-md transition " +
                    (filter === f
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40")
                  }
                >
                  {f === "all" ? "Tümü" : f === "pinned" ? "Sabitli" : "Arşiv"}
                </button>
              ))}
            </div>
            <div className="px-3 pb-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-sidebar-foreground/50 mb-1">
                <span>Klasörler</span>
                <button
                  onClick={handleCreateFolder}
                  className="inline-flex items-center gap-1 normal-case tracking-normal text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  title="Yeni klasör"
                  aria-label="Yeni klasör"
                >
                  <FolderPlus className="w-3 h-3" /> Yeni
                </button>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <button
                  onClick={() => setFolderFilter(null)}
                  className={
                    "px-2 py-1 rounded-md transition " +
                    (folderFilter === null
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40")
                  }
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFolderFilter("none")}
                  className={
                    "px-2 py-1 rounded-md transition " +
                    (folderFilter === "none"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40")
                  }
                >
                  Atanmamış
                </button>
                {(foldersQ.data ?? []).map((fd) => (
                  <div
                    key={fd.id}
                    className="group/folder inline-flex items-center rounded-md overflow-hidden"
                  >
                    <button
                      onClick={() => setFolderFilter(fd.id)}
                      className={
                        "pl-2 pr-1 py-1 transition inline-flex items-center gap-1 " +
                        (folderFilter === fd.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40")
                      }
                    >
                      <Folder className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{fd.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(fd.id, fd.name)}
                      className="px-1 py-1 text-sidebar-foreground/40 hover:text-destructive opacity-0 group-hover/folder:opacity-100 transition"
                      aria-label={`${fd.name} klasörünü sil`}
                      title="Sil"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
              <div className="px-2 py-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 flex items-center justify-between">
                <span>
                  {filter === "pinned"
                    ? "Sabitlenmiş"
                    : filter === "archived"
                      ? "Arşiv"
                      : "Dosyalarım"}{" "}
                  {filteredThreads.length > 0 && `(${filteredThreads.length})`}
                </span>
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="inline-flex items-center gap-1 text-sidebar-foreground/50 hover:text-sidebar-foreground normal-case tracking-normal"
                  aria-label="Komut paleti"
                  title="Komut paleti (⌘K)"
                >
                  <Command className="w-3 h-3" /> K
                </button>
              </div>
              {filteredThreads.map((t) => {
                const active = t.id === threadId;
                return (
                  <div
                    key={t.id}
                    className={`group flex items-center rounded-lg text-sm transition ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      onClick={() => setSidebarOpen(false)}
                      className="flex-1 truncate px-3 py-2 flex items-center gap-1.5"
                    >
                      {t.pinned && <Pin className="w-3 h-3 shrink-0 text-primary" />}
                      <span className="truncate">{t.title}</span>
                    </Link>
                    <button
                      onClick={(e) => handleTogglePin(t.id, t.pinned, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-sidebar-foreground/60 hover:text-primary transition"
                      aria-label={t.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                      title={t.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                    >
                      {t.pinned ? (
                        <PinOff className="w-3.5 h-3.5" />
                      ) : (
                        <Pin className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleToggleArchive(t.id, t.archived, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-sidebar-foreground/60 hover:text-primary transition"
                      aria-label={t.archived ? "Arşivden çıkar" : "Arşivle"}
                      title={t.archived ? "Arşivden çıkar" : "Arşivle"}
                    >
                      {t.archived ? (
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleRename(t.id, t.title, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-sidebar-foreground/60 hover:text-primary transition"
                      aria-label="Yeniden adlandır"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 opacity-0 group-hover:opacity-100 text-sidebar-foreground/60 hover:text-primary transition"
                          aria-label="Klasöre taşı"
                          title="Klasöre taşı"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => handleAssignFolder(t.id, null)}>
                          Klasörsüz
                        </DropdownMenuItem>
                        {(foldersQ.data ?? []).map((fd) => (
                          <DropdownMenuItem
                            key={fd.id}
                            onClick={() => handleAssignFolder(t.id, fd.id)}
                          >
                            <Folder className="w-3 h-3 mr-2" /> {fd.name}
                          </DropdownMenuItem>
                        ))}
                        {(foldersQ.data?.length ?? 0) === 0 && (
                          <DropdownMenuItem disabled>Henüz klasör yok</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-sidebar-foreground/60 hover:text-destructive transition"
                      aria-label="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {filteredThreads.length === 0 && (
                <div className="px-3 py-6 text-center text-[11px] text-sidebar-foreground/40">
                  {search
                    ? "Sonuç bulunamadı."
                    : filter === "pinned"
                      ? "Sabitlenmiş dosya yok."
                      : filter === "archived"
                        ? "Arşiv boş."
                        : "Henüz dosya yok."}
                </div>
              )}
            </div>
          </>
        )}

        {usage && (
          <div className="px-4 py-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/60 space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span>Saatlik</span>
                <span>
                  {usage.hourCount}/{usage.hourLimit}
                </span>
              </div>
              <div className="h-1 bg-sidebar-accent/40 rounded overflow-hidden">
                <div
                  className={`h-full ${hourPct > 80 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${hourPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Günlük</span>
                <span>
                  {usage.dayCount}/{usage.dayLimit}
                </span>
              </div>
              <div className="h-1 bg-sidebar-accent/40 rounded overflow-hidden">
                <div
                  className={`h-full ${dayPct > 80 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${dayPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <ThemeToggle />
          <Link
            to="/sablonlar"
            className="flex w-full items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground px-2 py-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Dilekçe Şablonları
          </Link>
          <Link
            to="/fiyatlar"
            className="flex w-full items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground px-2 py-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Fiyatlandırma
          </Link>
          <Link
            to="/hesap"
            className="flex w-full items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground px-2 py-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Hesabım
          </Link>
          <button
            onClick={handleShareThread}
            className="flex w-full items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground px-2 py-1.5"
          >
            <Share2 className="w-3.5 h-3.5" /> Bu Dosyayı Paylaş
          </button>
          {adminQ.data?.admin && (
            <Link
              to="/admin"
              className="flex w-full items-center gap-2 text-xs text-primary hover:text-primary/80 px-2 py-1.5"
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground px-2 py-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Verilerimi İndir
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex w-full items-center gap-2 text-xs text-destructive/80 hover:text-destructive px-2 py-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Hesabımı Sil
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground px-2 py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
          </button>
          <div className="pt-2 flex gap-2 flex-wrap text-[10px] text-sidebar-foreground/50">
            <Link to="/gizlilik" className="hover:text-sidebar-foreground/80">
              Gizlilik
            </Link>
            <span>·</span>
            <Link to="/kullanim-sartlari" className="hover:text-sidebar-foreground/80">
              Şartlar
            </Link>
            <span>·</span>
            <Link to="/kvkk" className="hover:text-sidebar-foreground/80">
              KVKK
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/40 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-foreground/70 hover:text-foreground"
            aria-label="Dosyalarım"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
            aria-label="Ana sayfa"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ana Sayfa</span>
          </Link>
          <Link
            to="/sablonlar"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Şablonlar</span>
          </Link>
          <button
            onClick={handleNewThread}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-primary-foreground bg-primary hover:opacity-90 rounded-md px-2.5 py-1.5"
            aria-label="Yeni sohbet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium truncate">
              {threadsQ.data?.find((t) => t.id === threadId)?.title ?? "Yeni Dosya"}
              <span className="sr-only">
                {" "}
                — Hukuk Asistanı, Profesyonel Hukuki Asistan
              </span>
            </h1>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Hukuki Danışma Oturumu
            </div>
          </div>
          <Link
            to="/"
            className="sm:hidden p-2 text-foreground/70 hover:text-foreground"
            aria-label="Ana sayfa"
          >
            <Home className="w-5 h-5" />
          </Link>
          <button
            onClick={handleNewThread}
            className="sm:hidden p-2 text-foreground/70 hover:text-foreground"
            aria-label="Yeni sohbet"
          >
            <Plus className="w-5 h-5" />
          </button>
          {messages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Konuşmayı indir">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportThread("pdf")}>
                  Tüm konuşma — PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportThread("docx")}>
                  Tüm konuşma — DOCX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportThread("md")}>
                  Tüm konuşma — Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <ChatTicker />

        {usage && (hourPct >= 80 || dayPct >= 80) && (
          <div
            className={
              "px-4 py-2 text-xs border-b " +
              (hourPct >= 100 || dayPct >= 100
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400")
            }
          >
            {hourPct >= 100 || dayPct >= 100 ? (
              <>
                Mesaj limitine ulaştınız ({usage.hourCount}/{usage.hourLimit} saatlik,{" "}
                {usage.dayCount}/{usage.dayLimit} günlük).{" "}
                <Link to="/fiyatlar" className="underline font-medium">
                  Planı yükselt
                </Link>
                .
              </>
            ) : (
              <>
                Kotanızın %{Math.round(Math.max(hourPct, dayPct))}'ini kullandınız.{" "}
                <Link to="/fiyatlar" className="underline font-medium">
                  Planı yükselt
                </Link>
                .
              </>
            )}
          </div>
        )}

        <Conversation className="flex-1">
          <ConversationContent className="max-w-3xl mx-auto w-full px-4 py-6">
            {isEmpty ? (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-6">
                  {rotation.greeting}
                </h2>

                {/* Sanal Duruşma Salonu — belirgin giriş */}
                <Link
                  to="/durusma"
                  className="group w-full max-w-2xl mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition px-4 py-3 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                    <Gavel className="w-4.5 h-4.5 text-primary" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-serif text-[15px] text-foreground">
                      Sanal Duruşma Salonu
                    </span>
                    <span className="block text-[11px] text-muted-foreground leading-relaxed">
                      Dosyanız veya beyanınız üzerinden hâkim, savcı ve vekillerin yer aldığı
                      duruşma simülasyonu başlatın.
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* İhtiyaç seçici — kullanıcı hukuki alanı seçince önerileri
                    ve ilgili şablon kısayolunu gösterir. */}
                {!selectedNeed ? (
                  <div className="w-full max-w-2xl mb-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Konu seçin, size özel öneriler getireyim
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {NEEDS.map((n) => (
                        <button
                          key={n.kind}
                          onClick={() => setSelectedNeed(n)}
                          className="group text-left border border-border rounded-xl px-3 py-2.5 hover:border-primary/50 hover:bg-accent/50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{n.emoji}</span>
                            <span className="text-sm font-medium text-foreground">{n.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{selectedNeed.emoji}</span>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-foreground">
                            {selectedNeed.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{selectedNeed.intro}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNeed(null)}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1"
                      >
                        Değiştir
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {selectedNeed.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleQuickPrompt(s)}
                          className="text-left text-sm text-foreground/90 border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-accent/50 transition"
                        >
                          <Scale className="w-3.5 h-3.5 inline-block mr-2 text-primary" />
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to="/sablonlar"
                        search={{ kategori: selectedNeed.kind }}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline border border-primary/30 bg-primary/5 rounded-full px-3 py-1.5"
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        {selectedNeed.label} şablonlarını gör
                      </Link>
                    </div>
                  </div>
                )}

                {/* Kararlar kategorileri — hızlı erişim */}
                <div className="mt-8 w-full max-w-3xl">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3 text-center">
                    Canlı Karar Arşivi
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Link
                      to="/kararlar/$kind"
                      params={{ kind: "yargitay" }}
                      className="group rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-sm transition"
                    >
                      <Gavel className="w-5 h-5 text-primary mb-2" />
                      <div className="font-serif text-[15px] mb-0.5">Yargıtay Kararları</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Hukuk & Ceza Genel Kurulu ile daire kararları — canlı.
                      </p>
                    </Link>
                    <Link
                      to="/kararlar/$kind"
                      params={{ kind: "aym" }}
                      className="group rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-sm transition"
                    >
                      <Landmark className="w-5 h-5 text-primary mb-2" />
                      <div className="font-serif text-[15px] mb-0.5">Anayasa Mahkemesi</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Bireysel başvuru ve norm denetimi kararları.
                      </p>
                    </Link>
                    <Link
                      to="/kararlar/$kind"
                      params={{ kind: "emsal" }}
                      className="group rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-sm transition"
                    >
                      <BookOpen className="w-5 h-5 text-primary mb-2" />
                      <div className="font-serif text-[15px] mb-0.5">Emsal / İçtihat</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Yargıtay, Danıştay, AİHM ve öne çıkan içtihatlar.
                      </p>
                    </Link>
                  </div>
                </div>

                {/* Dava dosyalarım — asıl konu */}
                <CaseFilesPanel />

                {/* Kişiselleştirilmiş günlük gündem */}
                <PersonalizedUpdatesPanel
                  data={personalizedQ.data}
                  loading={personalizedQ.isLoading}
                  onAsk={handleQuickPrompt}
                />

                {/* Faydalı bağlantılar */}
                <UsefulLinks />
              </div>
            ) : (
              <>
                {messages.map((m) => {
                  const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                  const fileParts = m.parts.filter((p) => p.type === "file") as Array<{
                    type: "file";
                    url: string;
                    mediaType?: string;
                    filename?: string;
                  }>;

                  const isAssistant = m.role !== "user";
                  return (
                    <div key={m.id} className="group">
                      {fileParts.length > 0 && (
                        <div
                          className={`flex flex-wrap gap-2 mb-2 ${
                            m.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {fileParts.map((f, i) => {
                            const isImage = (f.mediaType ?? "").startsWith("image/");
                            return isImage ? (
                              <a
                                key={i}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-lg overflow-hidden border border-border max-w-[220px]"
                              >
                                <img
                                  src={f.url}
                                  alt={
                                    f.filename
                                      ? `Yüklenen belge görseli: ${f.filename}`
                                      : "Kullanıcının yüklediği belge görseli"
                                  }
                                  className="block max-h-56 object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent max-w-[220px]"
                              >
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">{f.filename ?? "Belge"}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                      {text && (
                        <Message from={m.role === "user" ? "user" : "assistant"}>
                          {m.role === "user" ? (
                            <MessageContent>{text}</MessageContent>
                          ) : (
                            <MessageContent className="!bg-transparent !p-0">
                              <MessageResponse>{text}</MessageResponse>
                            </MessageContent>
                          )}
                        </Message>
                      )}
                      {isAssistant && text && <CitationsList text={text} />}
                      {isAssistant && text && (
                        <div className="flex gap-1 pl-1 mt-1 mb-4 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleCopy(text)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
                          >
                            <Copy className="w-3 h-3" /> Kopyala
                          </button>
                          <button
                            onClick={() => handleRegenerate(m.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent disabled:opacity-50"
                          >
                            <RefreshCw className="w-3 h-3" /> Yeniden üret
                          </button>
                          <button
                            onClick={() => handleQuote(text)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
                            title="Bu yanıttan alıntı yap"
                          >
                            <Quote className="w-3 h-3" /> Alıntıla
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, 1)}
                            className={
                              "inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-accent " +
                              (feedbackMap[m.id] === 1
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground")
                            }
                            aria-label="Yararlı"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, -1)}
                            className={
                              "inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-accent " +
                              (feedbackMap[m.id] === -1
                                ? "text-destructive"
                                : "text-muted-foreground hover:text-foreground")
                            }
                            aria-label="Yararsız"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent">
                                <Download className="w-3 h-3" /> İndir
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => exportPdf(text)}>
                                PDF olarak indir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportDocx(text)}>
                                Word (.docx) indir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportMarkdown(text)}>
                                Markdown (.md) indir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  );
                })}

                {status === "submitted" && (
                  <Message from="assistant">
                    <MessageContent className="!bg-transparent !p-0">
                      <Shimmer>Hukuki değerlendirme hazırlanıyor…</Shimmer>
                    </MessageContent>
                  </Message>
                )}
                {error && <div className="text-sm text-destructive px-2 py-1">{error.message}</div>}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mobile-chat-composer border-t border-border bg-card/40 backdrop-blur px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <PromptInput
              onSubmit={handleSubmit}
              accept="image/*,application/pdf"
              multiple
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024}
              onError={(e) => {
                if (e.code === "max_files") toast.error("En fazla 5 dosya ekleyebilirsiniz.");
                else if (e.code === "max_file_size") toast.error("Dosya çok büyük (maks. 10 MB).");
                else if (e.code === "accept")
                  toast.error("Yalnızca görsel veya PDF dosyası yükleyebilirsiniz.");
              }}
            >
              <AttachmentsPreview />
              <PromptInputTextarea placeholder="Hukuki sorunuzu yazın veya dosya/PDF ekleyin..." />
              <PromptInputFooter>
                <PromptInputTools>
                  <AttachButton />
                  <VoiceInputButton />
                </PromptInputTools>
                <PromptInputSubmit
                  size="icon-sm"
                  className="rounded-full h-9 w-9"
                  status={status}
                  onStop={stop}
                />
              </PromptInputFooter>
            </PromptInput>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Bilgilendirme amaçlıdır; avukatlık hizmeti veya kesin hukuki görüş yerine geçmez.
            </p>
          </div>
        </div>
      </main>
      <DisclaimerModal />
      <OnboardingTour />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        threads={threadsQ.data ?? []}
        onNewThread={handleNewThread}
      />
    </div>
  );
}

function AttachButton() {
  const attachments = usePromptInputAttachments();
  return (
    <button
      type="button"
      onClick={() => attachments.openFileDialog()}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-accent"
      aria-label="Dosya ekle"
    >
      <Paperclip className="w-4 h-4" />
      <span className="hidden sm:inline">Dosya</span>
    </button>
  );
}

function AttachmentsPreview() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-border/60">
      {attachments.files.map((f) => {
        const isImage = (f.mediaType ?? "").startsWith("image/");
        return (
          <div
            key={f.id}
            className="relative group flex items-center gap-2 pl-2 pr-7 py-1.5 rounded-md border border-border bg-card text-xs max-w-[220px]"
          >
            {isImage ? (
              <img src={f.url} alt="" className="w-8 h-8 object-cover rounded" />
            ) : (
              <FileText className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="truncate">{f.filename ?? "dosya"}</span>
            <button
              type="button"
              onClick={() => attachments.remove(f.id)}
              className="absolute top-1 right-1 p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              aria-label="Kaldır"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Kişiselleştirilmiş günlük gündem paneli ---------------- */

const PU_KIND_LABEL: Record<string, string> = {
  AYM: "AYM",
  YARGITAY: "Yargıtay",
  DANISTAY: "Danıştay",
  AIHM: "AİHM",
  KANUN: "Yeni Kanun",
  RG: "Resmî Gazete",
  ICTIHAT: "İçtihat",
};

function relDayTr(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((Date.now() - d.getTime()) / 86400000);
  if (diff <= 0) return "Bugün";
  if (diff === 1) return "Dün";
  if (diff < 7) return `${diff} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function buildAskPrompt(it: DailyUpdate): string {
  const lines = [
    `Aşağıdaki kararın ne olduğunu tarafsız, sade bir dille açıkla. Kararın konusu, dayandığı hukuki mesele ve mahkemenin vardığı sonuç nedir? Sadece kararın içeriğini özetle; "acil risk", "hemen şunu yapın", tavsiye, uyarı veya kişisel yorum ekleme. Abartma, önyargı ve genel hukuki uyarı cümleleri kullanma.`,
    ``,
    `Başlık: ${it.title}`,
    `Tür: ${PU_KIND_LABEL[it.kind] ?? it.kind}`,
  ];
  if (it.ref) lines.push(`Numara: ${it.ref}`);
  if (it.source) lines.push(`Kaynak: ${it.source}`);
  if (it.url) lines.push(`Bağlantı: ${it.url}`);
  lines.push(``, `Mevcut özet:`, it.summary);
  return lines.join("\n");
}

function resolveSourceUrl(it: DailyUpdate): string {
  if (it.url) return it.url;
  if (it.kind === "YARGITAY") return "https://karararama.yargitay.gov.tr/";
  if (it.kind === "AYM") return "https://kararlarbilgibankasi.anayasa.gov.tr/";
  if (it.kind === "DANISTAY") return "https://karararama.danistay.gov.tr/";
  if (it.kind === "AIHM") return "https://hudoc.echr.coe.int/tur";
  if (it.kind === "ICTIHAT") return "https://emsal.uyap.gov.tr/";
  if (it.kind === "RG") return "https://www.resmigazete.gov.tr/";
  if (it.kind === "KANUN") return "https://www.mevzuat.gov.tr/";
  return "https://www.turkiye.gov.tr/";
}

function PersonalizedUpdatesPanel({
  data,
  loading,
  onAsk,
}: {
  data: Awaited<ReturnType<typeof listPersonalizedUpdates>> | undefined;
  loading: boolean;
  onAsk?: (text: string) => void;
}) {
  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null);
  const fetchSourceFn = useServerFn(fetchUpdateSource);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [sourceData, setSourceData] = useState<{
    host: string;
    title: string | null;
    text: string;
    fetched_at: string;
  } | null>(null);
  const [sourcePage, setSourcePage] = useState(0);
  const PAGE_SIZE = 4000;

  const openSourceInApp = async (url: string) => {
    setSourceOpen(true);
    setSourceLoading(true);
    setSourceError(null);
    setSourceData(null);
    setSourcePage(0);
    try {
      const res = await fetchSourceFn({ data: { url } });
      if (!res.ok) {
        setSourceError(res.error);
      } else {
        setSourceData({
          host: res.host,
          title: res.title,
          text: res.text,
          fetched_at: res.fetched_at,
        });
      }
    } catch (e) {
      setSourceError((e as Error).message || "Kaynak alınamadı.");
    } finally {
      setSourceLoading(false);
    }
  };

  const sourcePages = sourceData ? Math.max(1, Math.ceil(sourceData.text.length / PAGE_SIZE)) : 1;
  const sourceChunk = sourceData
    ? sourceData.text.slice(sourcePage * PAGE_SIZE, (sourcePage + 1) * PAGE_SIZE)
    : "";

  if (loading) {
    return (
      <div className="mt-10 w-full max-w-3xl mx-auto">
        <div className="h-6 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  const interests = data?.interests ?? [];
  const items = (data?.items ?? []).slice(0, 4);
  // Only show when we actually have personalized matches; ticker already covers generic gündem.
  if (items.length === 0 || interests.length === 0) return null;

  return (
    <section
      className="mt-10 w-full max-w-3xl mx-auto text-left"
      aria-label="Sizi ilgilendiren güncel kararlar"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Scale className="w-3.5 h-3.5" />
            Sizi İlgilendiren 4 Karar
          </div>
          <h3 className="font-serif text-lg mt-1">Dosyalarınızla ilgili son gelişmeler</h3>
        </div>
        {interests.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[240px]">
            {interests.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider bg-accent border border-border rounded-full px-2 py-0.5 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it) => {
          const handleOpen = () => {
            setSelectedUpdate(it);
            void openSourceInApp(resolveSourceUrl(it));
          };
          return (
            <article
              key={it.id}
              onClick={handleOpen}
              className="group rounded-lg border border-border bg-card p-3.5 hover:border-primary/40 hover:shadow-sm transition cursor-pointer flex flex-col"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleOpen();
              }}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 font-semibold">
                  {PU_KIND_LABEL[it.kind] ?? it.kind}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {relDayTr(it.published_at)}
                </span>
              </div>
              <h4 className="font-serif text-[15px] leading-snug mb-1.5 line-clamp-2">
                {it.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {it.summary}
              </p>
              {it.ref && (
                <p className="text-[10px] text-muted-foreground/70 font-mono truncate mt-2">
                  {it.ref}
                </p>
              )}
              <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/60">
                {onAsk ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAsk(buildAskPrompt(it));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                    title="Bu kararı asistana sor"
                  >
                    <Scale className="w-3 h-3" />
                    Asistana sor
                  </button>
                ) : (
                  <span />
                )}
                <a
                  href={resolveSourceUrl(it)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary hover:underline"
                  title={it.source ?? "Resmî kaynağı aç"}
                >
                  <ExternalLink className="w-3 h-3" />
                  {it.source ?? "Resmî kaynak"}
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">
        Bu öneriler açtığınız dosyaların başlıklarından çıkarılır. Farklı bir alanla
        ilgileniyorsanız yeni dosya açın; öneriler otomatik güncellenir.
      </p>

      <Dialog open={!!selectedUpdate} onOpenChange={(open) => !open && setSelectedUpdate(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedUpdate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 font-semibold">
                    {PU_KIND_LABEL[selectedUpdate.kind] ?? selectedUpdate.kind}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(selectedUpdate.published_at + "T00:00:00").toLocaleDateString(
                      "tr-TR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <DialogTitle className="font-serif text-lg leading-snug text-left">
                  {selectedUpdate.title}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-sm text-foreground/90 leading-relaxed text-left">
                {selectedUpdate.summary}
              </DialogDescription>
              <div className="space-y-3 mt-1">
                {selectedUpdate.ref && (
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          Başvuru / Esas / Karar No
                        </p>
                        <p className="text-sm font-mono text-foreground break-words">
                          {selectedUpdate.ref}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selectedUpdate.ref!);
                            toast.success("Numara panoya kopyalandı");
                          } catch {
                            toast.error("Kopyalanamadı");
                          }
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
                        title="Numarayı kopyala"
                      >
                        <Copy className="w-3 h-3" />
                        Kopyala
                      </button>
                    </div>
                  </div>
                )}
                {selectedUpdate.tags && selectedUpdate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedUpdate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase tracking-wider bg-accent border border-border rounded-full px-2 py-0.5 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="mt-2 sm:justify-start gap-2 flex-wrap">
                {onAsk && (
                  <button
                    type="button"
                    onClick={() => {
                      onAsk(buildAskPrompt(selectedUpdate));
                      setSelectedUpdate(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <Scale className="w-4 h-4" />
                    Asistana sor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openSourceInApp(resolveSourceUrl(selectedUpdate))}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent transition"
                >
                  <FileText className="w-4 h-4" />
                  Kaynağı görüntüle{selectedUpdate.source ? " · " + selectedUpdate.source : ""}
                </button>
                <a
                  href={resolveSourceUrl(selectedUpdate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  title="Yeni sekmede aç"
                >
                  <ExternalLink className="w-3 h-3" />
                  Yeni sekmede
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(resolveSourceUrl(selectedUpdate));
                      toast.success("Bağlantı panoya kopyalandı");
                    } catch {
                      toast.error("Kopyalanamadı");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  title="Linki kopyala"
                >
                  <Copy className="w-3 h-3" />
                  Linki kopyala
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={sourceOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSourceOpen(false);
            setSourceData(null);
            setSourceError(null);
            setSourcePage(0);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-base leading-snug text-left pr-8">
              {sourceData?.title ?? selectedUpdate?.title ?? "Kaynak metni"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-left">
              {sourceLoading
                ? "Kaynak alınıyor…"
                : sourceData
                  ? `${sourceData.host} · ${new Date(sourceData.fetched_at).toLocaleString("tr-TR")}`
                  : sourceError
                    ? "Kaynak açılamadı"
                    : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[200px] overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
            {sourceLoading && (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 bg-muted rounded animate-pulse"
                    style={{ width: `${60 + ((i * 13) % 35)}%` }}
                  />
                ))}
              </div>
            )}
            {!sourceLoading && sourceError && (
              <div className="text-sm text-destructive">
                {sourceError}
                {selectedUpdate?.url && (
                  <div className="mt-3">
                    <a
                      href={selectedUpdate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Yeni sekmede aç
                    </a>
                  </div>
                )}
              </div>
            )}
            {!sourceLoading && sourceData && (
              <pre className="whitespace-pre-wrap break-words font-serif text-[13.5px] leading-relaxed text-foreground">
                {sourceChunk}
              </pre>
            )}
          </div>

          <DialogFooter className="mt-2 sm:justify-between gap-2 flex-wrap items-center">
            <div className="flex items-center gap-2">
              {sourceData && sourcePages > 1 && (
                <>
                  <button
                    type="button"
                    disabled={sourcePage === 0}
                    onClick={() => setSourcePage((p) => Math.max(0, p - 1))}
                    className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    ← Önceki
                  </button>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    Sayfa {sourcePage + 1} / {sourcePages}
                  </span>
                  <button
                    type="button"
                    disabled={sourcePage >= sourcePages - 1}
                    onClick={() => setSourcePage((p) => Math.min(sourcePages - 1, p + 1))}
                    className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    Sonraki →
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sourceData && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(sourceData.text);
                      toast.success("Metin panoya kopyalandı");
                    } catch {
                      toast.error("Kopyalanamadı");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <Copy className="w-3 h-3" />
                  Metni kopyala
                </button>
              )}
              {selectedUpdate?.url && (
                <a
                  href={selectedUpdate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  Orijinal
                </a>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ---------------- Ana ekran üstü canlı kayan yazı ---------------- */
function kararlarKindFor(k: string): "yargitay" | "aym" | "emsal" | null {
  if (k === "YARGITAY") return "yargitay";
  if (k === "AYM") return "aym";
  if (k === "DANISTAY" || k === "AIHM" || k === "ICTIHAT") return "emsal";
  return null;
}

function ChatTicker() {
  const fetchUpdates = useServerFn(listDailyUpdates);
  const q = useQuery({
    queryKey: ["chat-ticker"],
    queryFn: () => fetchUpdates({ data: { limit: 20, offset: 0 } }),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const items = (q.data ?? []) as DailyUpdate[];
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className="border-b border-border bg-card/60 overflow-hidden">
      <div className="flex items-center">
        <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-semibold px-3 py-1.5 border-r border-border bg-background/60">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Canlı Gündem
        </span>
        <div className="flex-1 overflow-hidden relative group/ticker">
          <TooltipProvider delayDuration={150}>
            <div
              className="flex gap-8 whitespace-nowrap py-1.5 text-xs group-hover/ticker:[animation-play-state:paused]"
              style={{ animation: "chatTickerScroll 90s linear infinite" }}
            >
              {doubled.map((it, i) => {
                const cat = kararlarKindFor(it.kind);
                const label = PU_KIND_LABEL[it.kind] ?? it.kind;
                const inner = (
                  <>
                    <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                      {label}
                    </span>
                    <span className="text-foreground/85 hover:underline">{it.title}</span>
                    <span className="text-muted-foreground">·</span>
                  </>
                );
                return (
                  <Tooltip key={`${it.id}-${i}`}>
                    <TooltipTrigger asChild>
                      {cat ? (
                        <Link
                          to="/kararlar/$kind"
                          params={{ kind: cat }}
                          search={{ highlight: it.id }}
                          className="inline-flex items-center gap-2 hover:text-primary transition"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <a
                          href={resolveSourceUrl(it)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 hover:text-primary transition"
                        >
                          {inner}
                        </a>
                      )}
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-sm whitespace-normal bg-popover text-popover-foreground border border-border shadow-lg"
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                          {label}
                          {it.ref ? ` · ${it.ref}` : ""}
                        </div>
                        <div className="font-medium text-xs leading-snug">{it.title}</div>
                        {it.summary && (
                          <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
                            {it.summary}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground pt-1">
                          {cat ? "Karar sayfasında aç →" : "Kaynağı aç →"}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
      <style>{`@keyframes chatTickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ---------------- Faydalı bağlantılar (e-Devlet, UYAP vs.) ---------------- */
const USEFUL_LINKS: Array<{ label: string; href: string; desc: string }> = [
  {
    label: "e-Devlet",
    href: "https://www.turkiye.gov.tr/",
    desc: "Resmî belgeler, başvurular, sorgulama",
  },
  {
    label: "UYAP Vatandaş",
    href: "https://vatandas.uyap.gov.tr/",
    desc: "Dava, dosya ve duruşma sorgu",
  },
  { label: "UYAP Avukat", href: "https://avukat.uyap.gov.tr/", desc: "Avukat portalı" },
  { label: "Resmî Gazete", href: "https://www.resmigazete.gov.tr/", desc: "Yürürlükteki mevzuat" },
  { label: "Mevzuat.gov.tr", href: "https://www.mevzuat.gov.tr/", desc: "Kanun, KHK, yönetmelik" },
  {
    label: "AYM Kararlar BB",
    href: "https://kararlarbilgibankasi.anayasa.gov.tr/",
    desc: "Anayasa Mahkemesi kararları",
  },
  {
    label: "Yargıtay Karar Arama",
    href: "https://karararama.yargitay.gov.tr/",
    desc: "Yargıtay içtihat arama",
  },
  { label: "Danıştay", href: "https://www.danistay.gov.tr/", desc: "Danıştay kararları" },
  { label: "HUDOC (AİHM)", href: "https://hudoc.echr.coe.int/", desc: "AİHM karar veritabanı" },
  {
    label: "Barolar Birliği",
    href: "https://www.barobirlik.org.tr/",
    desc: "TBB duyuru ve kaynakları",
  },
  { label: "GİB (Vergi)", href: "https://www.gib.gov.tr/", desc: "Gelir İdaresi Başkanlığı" },
  { label: "SGK", href: "https://www.sgk.gov.tr/", desc: "Sosyal Güvenlik Kurumu" },
];

function UsefulLinks() {
  return (
    <section
      className="mt-12 w-full max-w-3xl mx-auto text-left"
      aria-label="Faydalı hukuki bağlantılar"
    >
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
          <ExternalLink className="w-3.5 h-3.5" /> Faydalı Bağlantılar
        </div>
        <h3 className="font-serif text-lg mt-1">Sık kullanılan resmî portallar</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {USEFUL_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/40 hover:shadow-sm transition"
            title={l.desc}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                {l.label}
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{l.desc}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
