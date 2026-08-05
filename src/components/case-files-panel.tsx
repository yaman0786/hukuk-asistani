import { useState, useRef, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Gavel,
  Briefcase,

  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Sparkles,
  X,
  Bot,
  ChevronDown,
  Copy,
  MessageSquare,
  Search,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listThreads, createThread } from "@/lib/threads.functions";
import {
  listCaseFiles,
  listCaseReports,
  createCaseFile,
  deleteCaseFile,
  deleteCaseReport,
  updateCaseFile,
  analyzeMyCaseFilesNow,
  signCaseFileUrl,
  type CaseFile,
  type CaseReport,
} from "@/lib/case-files.functions";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

async function readAsText(file: File): Promise<string | null> {
  if (
    !/^(text\/|application\/(json|xml))/i.test(file.type) &&
    !/\.(txt|md|json|xml|csv)$/i.test(file.name)
  ) {
    return null;
  }
  try {
    return await file.text();
  } catch {
    return null;
  }
}

export function CaseFilesPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCaseFiles);
  const reportsFn = useServerFn(listCaseReports);
  const createFn = useServerFn(createCaseFile);
  const delFn = useServerFn(deleteCaseFile);
  const updateFn = useServerFn(updateCaseFile);
  const analyzeFn = useServerFn(analyzeMyCaseFilesNow);
  const signFn = useServerFn(signCaseFileUrl);
  const delReportFn = useServerFn(deleteCaseReport);
  const listThreadsFn = useServerFn(listThreads);
  const createThreadFn = useServerFn(createThread);
  const navigate = useNavigate();

  const filesQ = useQuery({
    queryKey: ["case-files"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });
  const reportsQ = useQuery({
    queryKey: ["case-reports"],
    queryFn: () => reportsFn(),
    staleTime: 30_000,
  });

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<CaseReport | null>(null);
  const [showAddNote, setShowAddNote] = useState<CaseFile | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteUyap, setNoteUyap] = useState("");
  const [noteCourt, setNoteCourt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive" | "analyzed" | "unanalyzed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7" | "30" | "90">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  const allFiles = filesQ.data ?? [];
  const reports = reportsQ.data ?? [];
  const activeCount = allFiles.filter((f) => f.bot_active).length;

  const files = useMemo<CaseFile[]>(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    const now = Date.now();
    const days = dateFilter === "all" ? null : Number(dateFilter);
    const out = allFiles.filter((f) => {
      if (q) {
        const hay = [f.title, f.uyap_no ?? "", f.court ?? ""].join(" ").toLocaleLowerCase("tr-TR");
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "active" && !f.bot_active) return false;
      if (statusFilter === "passive" && f.bot_active) return false;
      if (statusFilter === "analyzed" && !f.last_analyzed_at) return false;
      if (statusFilter === "unanalyzed" && f.last_analyzed_at) return false;
      if (days !== null) {
        const t = new Date(f.created_at).getTime();
        if (!Number.isFinite(t) || now - t > days * 86_400_000) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title, "tr-TR");
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortBy === "oldest" ? d : -d;
    });
    return out;
  }, [allFiles, search, statusFilter, dateFilter, sortBy]);

  const filtersActive = search.trim() !== "" || statusFilter !== "all" || dateFilter !== "all";

  const fileTitle = (id: string | null | undefined) =>
    allFiles.find((f) => f.id === id)?.title ?? "Tüm dosyalar";

  async function removeReport(id: string) {
    try {
      await delReportFn({ data: { id } });
      setOpenReport(null);
      await qc.invalidateQueries({ queryKey: ["case-reports"] });
    } catch (e) {
      toast.error((e as Error).message || "Rapor silinemedi.");
    }
  }

  async function copyReport(r: CaseReport) {
    try {
      await navigator.clipboard.writeText(r.summary);
      toast.success("Rapor panoya kopyalandı.");
    } catch {
      toast.error("Kopyalanamadı.");
    }
  }

  async function askAssistant(r: CaseReport) {
    try {
      const prompt = `Aşağıda kendi dava dosyam ("${fileTitle(r.case_file_id)}") için hazırlanan bot raporu var. Raporu sade bir dille açıkla ve bana somut sonraki adımları maddeler halinde yaz.\n\n---\n${r.summary}`;
      const existing = await listThreadsFn();
      const latest = (existing ?? []).find((t) => !t.archived) ?? existing?.[0];
      const target = latest ?? (await createThreadFn());
      try {
        sessionStorage.setItem(`autosend:${target.id}`, prompt);
      } catch {
        /* ignore */
      }
      setOpenReport(null);
      navigate({ to: "/chat/$threadId", params: { threadId: target.id } });
    } catch (e) {
      toast.error((e as Error).message || "İşlem başarısız.");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const uid = sess.user?.id;
      if (!uid) throw new Error("Oturum bulunamadı.");

      for (const file of Array.from(list)) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: 15 MB'den büyük olamaz.`);
          continue;
        }
        const safeName = file.name.replace(/[^\w.-]+/g, "_");
        const path = `${uid}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("case-files")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) {
          toast.error(`${file.name}: ${upErr.message}`);
          continue;
        }
        const extracted = await readAsText(file);
        await createFn({
          data: {
            title: file.name,
            storage_path: path,
            mime: file.type || undefined,
            size_bytes: file.size,
            extracted_text: extracted ?? undefined,
          },
        });
      }
      toast.success("Dosya(lar) yüklendi. Bot artık aktif.");
      await qc.invalidateQueries({ queryKey: ["case-files"] });
    } catch (err) {
      toast.error((err as Error).message || "Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu dava dosyasını silmek istediğinizden emin misiniz?")) return;
    try {
      await delFn({ data: { id } });
      toast.success("Dosya silindi.");
      qc.invalidateQueries({ queryKey: ["case-files"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleToggle(f: CaseFile) {
    try {
      await updateFn({ data: { id: f.id, bot_active: !f.bot_active } });
      qc.invalidateQueries({ queryKey: ["case-files"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleAnalyzeNow(caseFileId?: string) {
    if (!caseFileId && activeCount === 0) {
      toast.info("Önce en az bir dosya yükleyin ve botu aktif bırakın.");
      return;
    }
    setAnalyzing(caseFileId ?? "all");
    try {
      const res = await analyzeFn({ data: caseFileId ? { caseFileId } : {} });
      if (!res.ok) {
        toast.info(res.reason ?? "Aktif dosya yok.");
        return;
      }
      toast.success("Rapor hazır.");
      qc.invalidateQueries({ queryKey: ["case-reports"] });
      qc.invalidateQueries({ queryKey: ["case-files"] });
      setOpenReport(res.report);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAnalyzing(null);
    }
  }

  async function handleOpenFile(f: CaseFile) {
    try {
      const { url } = await signFn({ data: { id: f.id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message || "Dosya açılamadı.");
    }
  }

  async function saveNote() {
    if (!showAddNote) return;
    try {
      await updateFn({
        data: {
          id: showAddNote.id,
          extracted_text: noteText || undefined,
          uyap_no: noteUyap || undefined,
          court: noteCourt || undefined,
        },
      });
      toast.success("Not kaydedildi.");
      setShowAddNote(null);
      setNoteText("");
      setNoteUyap("");
      setNoteCourt("");
      qc.invalidateQueries({ queryKey: ["case-files"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="mt-10 w-full max-w-3xl mx-auto text-left" aria-label="Dava dosyalarım">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.04] to-primary/[0.01] p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              Dava Dosyalarım
            </div>
            <h3 className="font-serif text-xl mt-1">Botunuzu aktif hale getirin</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              UYAP'tan indirdiğiniz karar, dilekçe veya dosya özetlerini yükleyin. Asistan bot 7/24
              dosyalarınızı; yeni çıkan kanunlar, Yargıtay, AYM ve içtihat kararlarıyla eşleştirir
              ve lehinize olabilecek gelişmeleri sizin için raporlar.
            </p>
            <Link
              to="/durusma"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Gavel className="w-4 h-4" /> Bu dosyalarla sanal duruşma salonunu aç
            </Link>
          </div>

          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              {activeCount > 0 ? `Bot Aktif · ${activeCount}` : "Bot Pasif"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs rounded-full bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Yükleniyor…" : "Dosya Yükle"}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => handleAnalyzeNow()}
            disabled={analyzing !== null || activeCount === 0}
            className="inline-flex items-center gap-1.5 text-xs rounded-full border border-primary/30 bg-primary/5 text-primary px-3 py-1.5 hover:bg-primary/10 disabled:opacity-50"
          >
            {analyzing === "all" ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {analyzing === "all" ? "Bot çalışıyor…" : "Tümünü analiz et"}
          </button>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {filtersActive ? `${files.length}/${allFiles.length}` : files.length} dosya ·{" "}
            {reports.length} rapor
          </span>
        </div>

        {/* Search & filters */}
        {allFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Dosya adı, UYAP no veya mahkeme ara…"
                className="w-full text-xs rounded-full border border-border bg-card pl-8 pr-8 py-2 outline-none focus:border-primary/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Aramayı temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="text-xs rounded-full border border-border bg-card px-3 py-2 outline-none focus:border-primary/50"
              title="Duruma göre filtrele"
            >
              <option value="all">Tüm durumlar</option>
              <option value="active">Bot aktif</option>
              <option value="passive">Bot pasif</option>
              <option value="analyzed">Analiz edildi</option>
              <option value="unanalyzed">Analiz edilmedi</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className="text-xs rounded-full border border-border bg-card px-3 py-2 outline-none focus:border-primary/50"
              title="Tarihe göre filtrele"
            >
              <option value="all">Tüm tarihler</option>
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
              <option value="90">Son 90 gün</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs rounded-full border border-border bg-card px-3 py-2 outline-none focus:border-primary/50"
              title="Sıralama"
            >
              <option value="newest">En yeni</option>
              <option value="oldest">En eski</option>
              <option value="title">Dosya adı (A-Z)</option>
            </select>
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5"
              >
                Filtreleri temizle
              </button>
            )}
          </div>
        )}

        {allFiles.length > 0 && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-card/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  <Sparkles className="size-3.5" /> Dava istihbarat paneli
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Dosyalarınızın çalışma durumu ve bir sonraki güvenli adım.</p>
              </div>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
                {reports.length > 0 ? "Analiz mevcut" : "Analiz bekliyor"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                ["Toplam dosya", allFiles.length, FileText],
                ["Bot aktif", activeCount, Bot],
                ["Analiz edilen", allFiles.filter((f) => f.last_analyzed_at).length, CheckCircle2],
                ["Eksik analiz", allFiles.filter((f) => !f.last_analyzed_at).length, AlertTriangle],
              ].map(([label, value, Icon]) => (
                <div key={label as string} className="rounded-lg border border-border/70 bg-background/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Icon className="size-3.5 text-primary" />{label as string}</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{value as number}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Önerilen sıradaki adım:</span>
              {allFiles.some((f) => !f.last_analyzed_at)
                ? "Analiz edilmemiş dosyaları inceleyin; delil, çelişki ve eksik bilgi özeti üretilecek."
                : "Son raporu açın ve dosyayı duruşma provasında test edin."}
            </div>
          </div>
        )}

        {/* File list */}
        {filesQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
            <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-foreground/80 font-medium">
              {allFiles.length === 0 ? "Henüz dosya eklenmedi." : "Eşleşen dosya bulunamadı."}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {allFiles.length === 0
                ? "Bot çalışabilmesi için önce en az bir dava dosyanızı yükleyin."
                : "Arama veya filtre kriterlerinizi değiştirin."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
            {files.map((f) => (
              <li key={f.id} className="p-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <button
                  type="button"
                  onClick={() => handleOpenFile(f)}
                  className="min-w-0 flex-1 text-left group"
                  title="Dosyayı aç"
                >
                  <div className="text-sm font-medium truncate group-hover:text-primary group-hover:underline">
                    {f.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    {f.uyap_no && <span className="font-mono">{f.uyap_no}</span>}
                    {f.court && <span>· {f.court}</span>}
                    {f.size_bytes ? <span>· {(f.size_bytes / 1024).toFixed(0)} KB</span> : null}
                    {f.last_analyzed_at && (
                      <span>
                        · Son analiz: {new Date(f.last_analyzed_at).toLocaleString("tr-TR")}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnalyzeNow(f.id)}
                  disabled={analyzing !== null}
                  className="text-[11px] text-primary border border-primary/30 bg-primary/5 rounded-full px-2 py-0.5 hover:bg-primary/10 disabled:opacity-50 inline-flex items-center gap-1"
                  title="Bu dosyayı incele ve rapor üret"
                >
                  {analyzing === f.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  İncele
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(f);
                    setNoteText(f.extracted_text ?? "");
                    setNoteUyap(f.uyap_no ?? "");
                    setNoteCourt(f.court ?? "");
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-full px-2 py-0.5"
                  title="Bota not/özet ekle"
                >
                  Not
                </button>

                <label className="inline-flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.bot_active}
                    onChange={() => handleToggle(f)}
                    className="accent-primary"
                  />
                  Bot
                </label>
                <button
                  type="button"
                  onClick={() => handleDelete(f.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Reports */}
        {reports.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 inline-flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Son Bot Raporları
            </div>
            <ul className="space-y-2">
              {reports.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setOpenReport(r)}
                    className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground truncate max-w-[160px]">
                          {fileTitle(r.case_file_id)}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(r.created_at).toLocaleString("tr-TR")}
                        </span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </div>

                    <p className="text-sm text-foreground/85 line-clamp-2">
                      {r.summary.slice(0, 240)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Note editor */}
      {showAddNote && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowAddNote(null)}
        >
          <div
            className="bg-background border border-border rounded-2xl w-full max-w-lg p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg">Dosyaya not ekle</h4>
              <button
                onClick={() => setShowAddNote(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Bot'un dosyayı daha isabetli değerlendirmesi için UYAP dosya özeti, iddialar ve önemli
              tarihleri yapıştırın.
            </p>
            <div className="space-y-2">
              <input
                value={noteUyap}
                onChange={(e) => setNoteUyap(e.target.value)}
                placeholder="UYAP dosya no (opsiyonel)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={noteCourt}
                onChange={(e) => setNoteCourt(e.target.value)}
                placeholder="Mahkeme (örn. Ankara 3. İş Mahkemesi)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Dava konusu, iddialar, önemli tarih ve deliller…"
                rows={8}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddNote(null)}
                className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-accent"
              >
                Vazgeç
              </button>
              <button
                onClick={saveNote}
                className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report viewer */}
      {openReport && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpenReport(null)}
        >
          <div
            className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-semibold">
                  <Bot className="w-3 h-3" /> Bot Raporu · {fileTitle(openReport.case_file_id)}
                </div>
                <h4 className="font-serif text-lg">
                  {new Date(openReport.created_at).toLocaleString("tr-TR")}
                </h4>
              </div>
              <button
                onClick={() => setOpenReport(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 text-sm leading-relaxed whitespace-pre-wrap">
              {openReport.summary}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 p-3 border-t border-border">
              <button
                onClick={() => removeReport(openReport.id)}
                className="inline-flex items-center gap-1.5 text-xs rounded-full border border-border px-3 py-1.5 hover:text-destructive hover:border-destructive/40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sil
              </button>
              <button
                onClick={() => copyReport(openReport)}
                className="inline-flex items-center gap-1.5 text-xs rounded-full border border-border px-3 py-1.5 hover:bg-accent"
              >
                <Copy className="w-3.5 h-3.5" /> Kopyala
              </button>
              <button
                onClick={() => askAssistant(openReport)}
                className="inline-flex items-center gap-1.5 text-xs rounded-full bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Asistana sor
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
