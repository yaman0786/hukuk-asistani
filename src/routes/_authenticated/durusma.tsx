import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Gavel,
  History,
  Loader2,
  Lock,
  LogOut,
  Radio,
  Scale,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { listCaseFiles } from "@/lib/case-files.functions";
import {
  assessAppeal,
  closeHearing,
  continueHearing,
  openHearing,
  summarizeSession,
  type HearingSetup,
  type HearingTurn,
} from "@/lib/courtroom.functions";
import {
  appendHearingTurns,
  createHearingRoom,
  getHearingRoom,
  joinHearingRoom,
  leaveHearingRoom,
  listMyHearings,
  saveHearingVerdict,
  type LiveParticipant,
  type LiveTurn,
} from "@/lib/hearing-room.functions";
import { useHearingRealtime } from "@/hooks/useHearingRealtime";
import { useHearingNotificationPrefs } from "@/hooks/useHearingNotificationPrefs";
import { HearingNotificationSettings } from "@/components/hearing-notification-settings";
import { CitationsList } from "@/components/citations-list";
import {
  buildTranscriptMarkdown,
  downloadText,
  slugifyFilename,
} from "@/lib/hearing-export";

import {
  ACTION_HINT,
  ACTION_LABEL,
  ROLE_PERMISSIONS,
  canPerform,
  type CourtAction,
} from "@/lib/courtroom-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";


type RoomTurn = HearingTurn & { id?: string; action?: string | null; mine?: boolean };


const CASE_TYPES = [
  { value: "HUKUK", label: "Hukuk" },
  { value: "CEZA", label: "Ceza" },
  { value: "IS", label: "İş" },
  { value: "AILE", label: "Aile" },
  { value: "IDARE", label: "İdare" },
  { value: "ICRA", label: "İcra" },
  { value: "TUKETICI", label: "Tüketici" },
] as const;

const USER_ROLES = [
  { value: "HAKIM", label: "Hâkim" },
  { value: "SAVCI", label: "C. savcısı" },
  { value: "VEKIL", label: "Vekil (avukat)" },
  { value: "DAVACI", label: "Davacı" },
  { value: "DAVALI", label: "Davalı" },
  { value: "SANIK", label: "Sanık" },
  { value: "KATILAN", label: "Katılan / müşteki" },
  { value: "TANIK", label: "Tanık" },
] as const;

const ROLE_STYLE: Record<string, { label: string; className: string }> = {
  HAKIM: { label: "Hâkim", className: "border-primary/40 bg-primary/10" },
  SAVCI: { label: "C. Savcısı", className: "border-destructive/30 bg-destructive/5" },
  DAVACI_VEKILI: { label: "Davacı vekili", className: "border-border bg-muted/40" },
  DAVALI_VEKILI: { label: "Davalı vekili", className: "border-border bg-muted/40" },
  MUDAFI: { label: "Müdafi", className: "border-border bg-muted/40" },
  BILIRKISI: { label: "Bilirkişi", className: "border-border bg-accent/20" },
  KATIP: { label: "Zabıt kâtibi", className: "border-dashed border-border bg-background" },
  TARAF: { label: "Taraf", className: "border-border bg-muted/30" },
  SIZ: { label: "Siz", className: "border-primary bg-primary/5" },
};


const TITLE = "Sanal Duruşma Salonu — Belgelerinizle Gerçekçi Yargılama Simülasyonu";
const DESC =
  "Kendi dava belgelerinizi yükleyin; hâkim, savcı ve vekillerin yer aldığı gerçekçi bir duruşma simülasyonunda dosyanızı test edin.";

export const Route = createFileRoute("/_authenticated/durusma")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Türkiye Hukuk Master AI` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourtroomPage,
});

function CourtroomPage() {
  const open = useServerFn(openHearing);
  const cont = useServerFn(continueHearing);
  const close = useServerFn(closeHearing);
  const appeal = useServerFn(assessAppeal);
  const summarize = useServerFn(summarizeSession);
  const files = useServerFn(listCaseFiles);
  const createRoom = useServerFn(createHearingRoom);
  const joinRoom = useServerFn(joinHearingRoom);
  const loadRoom = useServerFn(getHearingRoom);
  const appendTurns = useServerFn(appendHearingTurns);
  const saveVerdict = useServerFn(saveHearingVerdict);
  const myHearings = useServerFn(listMyHearings);
  const leaveRoom = useServerFn(leaveHearingRoom);

  const { data: caseFiles } = useQuery({
    queryKey: ["case-files"],
    queryFn: () => files(),
  });

  const [caseFileId, setCaseFileId] = useState<string>("");
  const [statement, setStatement] = useState("");
  const [caseType, setCaseType] = useState<(typeof CASE_TYPES)[number]["value"]>("HUKUK");
  const [userRole, setUserRole] = useState<(typeof USER_ROLES)[number]["value"]>("DAVACI");
  const [displayName, setDisplayName] = useState("");

  const [setup, setSetup] = useState<HearingSetup | null>(null);
  const [turns, setTurns] = useState<RoomTurn[]>([]);
  const [verdict, setVerdict] = useState<string>("");
  const [appealNote, setAppealNote] = useState<string>("");
  const [sessions, setSessions] = useState<{ no: number; text: string }[]>([]);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState<
    null | "open" | "turn" | "verdict" | "join" | "appeal" | "resume"
  >(null);

  // Canlı oturum durumu
  const [hearingId, setHearingId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [isOwner, setIsOwner] = useState(true);

  const { data: pastHearings, refetch: refetchHearings } = useQuery({
    queryKey: ["my-hearings"],
    queryFn: () => myHearings(),
  });

  // Ad soyad tercihi tarayıcıda saklanır; tutanakta "Siz" yerine görünür.
  useEffect(() => {
    const saved = window.localStorage.getItem("hearing:displayName");
    if (saved) setDisplayName(saved);
  }, []);
  useEffect(() => {
    if (displayName.trim()) window.localStorage.setItem("hearing:displayName", displayName.trim());
  }, [displayName]);

  const myName = displayName.trim() || "Siz";


  const allowedActions = useMemo<CourtAction[]>(
    () => ROLE_PERMISSIONS[userRole] ?? [],
    [userRole],
  );
  const speakActions = useMemo<CourtAction[]>(
    () => allowedActions.filter((a) => a !== "KARAR" && a !== "KARAR_TALEBI"),
    [allowedActions],
  );

  const [action, setAction] = useState<CourtAction>(speakActions[0] ?? "BEYAN");

  useEffect(() => {
    if (!speakActions.includes(action)) setAction(speakActions[0] ?? "BEYAN");
  }, [speakActions, action]);

  const canSpeak = speakActions.length > 0;
  const canClose = canPerform(userRole, userRole === "HAKIM" ? "KARAR" : "KARAR_TALEBI");

  // Bildirim tercihleri (tür bazında aç/kapa)
  const { prefs: notifPrefs, update: updateNotifPrefs, isEnabled, activeCount } =
    useHearingNotificationPrefs();

  // Tutanak filtresi (mobilde hızlı gezinme)
  const [turnFilter, setTurnFilter] = useState<"ALL" | "BEYAN" | "ITIRAZ" | "DELIL" | "KARAR">(
    "ALL",
  );
  const [atBottom, setAtBottom] = useState(true);


  const turnKind = useCallback((t: RoomTurn): "BEYAN" | "ITIRAZ" | "DELIL" | "KARAR" => {
    const a = (t.action ?? "").toUpperCase();
    if (a.includes("ITIRAZ")) return "ITIRAZ";
    if (a.includes("DELIL")) return "DELIL";
    if (a.includes("KARAR")) return "KARAR";
    if (t.role === "HAKIM" && a.includes("ARA")) return "KARAR";
    return "BEYAN";
  }, []);

  const turnCounts = useMemo(() => {
    const c = { ALL: turns.length, BEYAN: 0, ITIRAZ: 0, DELIL: 0, KARAR: 0 };
    for (const t of turns) c[turnKind(t)] += 1;
    return c;
  }, [turns, turnKind]);

  const visibleTurns = useMemo(
    () => (turnFilter === "ALL" ? turns : turns.filter((t) => turnKind(t) === turnFilter)),
    [turns, turnFilter, turnKind],
  );

  // Celse safhaları: tutanağın gidişatına göre hangi aşamada olduğunuzu gösterir.
  const PHASES = useMemo(
    () =>
      [
        { key: "ACILIS", label: "Açılış" },
        { key: "ON_INCELEME", label: "Ön inceleme" },
        { key: "TAHKIKAT", label: "Tahkikat" },
        { key: "SOZLU", label: "Sözlü yargılama" },
        { key: "HUKUM", label: "Hüküm" },
      ] as const,
    [],
  );

  const phaseIndex = useMemo(() => {
    if (verdict) return 4;
    if (turns.length >= 16) return 3;
    if (turnCounts.DELIL > 0 || turns.length >= 8) return 2;
    if (turns.length >= 4) return 1;
    return 0;
  }, [verdict, turns.length, turnCounts.DELIL]);


  const endRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);
  useEffect(() => {
    if (turnFilter === "ALL") scrollToEnd();
  }, [turns.length, verdict, turnFilter, scrollToEnd]);

  useEffect(() => {
    const el = endRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => setAtBottom(entries[0]?.isIntersecting ?? true), {
      rootMargin: "0px 0px -120px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [setup]);

  /** Aynı kaydın iki kez düşmesini engelleyerek tutanağa ekler. */
  const mergeTurns = useCallback((incoming: RoomTurn[]) => {
    setTurns((prev) => {
      const seen = new Set(prev.map((t) => t.id).filter(Boolean) as string[]);
      const added = incoming.filter((t) => !t.id || !seen.has(t.id));
      return added.length ? [...prev, ...added] : prev;
    });
  }, []);

  const handleRemoteTurn = useCallback(
    (turn: LiveTurn) => {
      let isNew = false;
      setTurns((prev) => {
        if (prev.some((t) => t.id === turn.id)) return prev;
        isNew = true;
        return [...prev, { ...turn, role: turn.role as HearingTurn["role"] }];
      });
      if (isNew && turn.author_id && isEnabled(turnKind({ ...turn, role: turn.role as HearingTurn["role"] }))) {
        toast.message(`${turn.speaker || "Katılımcı"} söz aldı`, {
          description: turn.text.slice(0, 120),
        });
      }
    },
    [isEnabled, turnKind],
  );

  const refreshParticipants = useCallback(async () => {
    if (!hearingId) return;
    try {
      const state = await loadRoom({ data: { hearingId } });
      setParticipants(state.participants);
    } catch {
      /* sessizce geç */
    }
  }, [hearingId, loadRoom]);

  const handleRemoteVerdict = useCallback(
    (text: string) => {
      setVerdict(text);
      if (isEnabled("KARAR")) {
        toast.message("Karar tefhim edildi", { description: "Gerekçeli karar taslağı eklendi." });
      }
    },
    [isEnabled],
  );


  useHearingRealtime(hearingId, {
    onTurn: handleRemoteTurn,
    onParticipant: refreshParticipants,
    onVerdict: handleRemoteVerdict,
  });

  const payload = {
    caseFileId: caseFileId || undefined,
    statement: statement.trim() || undefined,
    caseType,
    userRole,
  };

  /** Celse bitince kaynaklı, standart formatlı özet üretir. */
  const runSessionSummary = useCallback(
    async (transcript: RoomTurn[], sessionNo: number) => {
      if (transcript.length === 0) return;
      setSummaryBusy(true);
      try {
        const res = await summarize({
          data: {
            caseType,
            userRole,
            sessionNo,
            transcript: transcript
              .slice(-60)
              .map((t) => ({ role: t.role, speaker: t.speaker, text: t.text })),
          },
        });
        setSessions((prev) =>
          prev.some((s) => s.no === res.sessionNo)
            ? prev.map((s) => (s.no === res.sessionNo ? { ...s, text: res.text } : s))
            : [...prev, { no: res.sessionNo, text: res.text }],
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Celse özeti oluşturulamadı.");
      } finally {
        setSummaryBusy(false);
      }
    },
    [caseType, summarize, userRole],
  );

  async function handleOpen() {
    if (!caseFileId && !statement.trim()) {
      toast.error("Bir dava dosyası seçin veya olayı kendi cümlelerinizle yazın.");
      return;
    }
    setBusy("open");
    try {
      const res = await open({ data: payload });
      setVerdict("");
      setSessions([]);
      setSetup(res.setup);
      setIsOwner(true);
      setAppealNote("");

      const room = await createRoom({
        data: {
          title: res.setup.title,
          court: res.setup.court,
          caseType,
          role: userRole,
          displayName: myName,
          setup: res.setup as unknown as Record<string, unknown>,
          turns: res.turns.map((t) => ({ role: t.role, speaker: t.speaker, text: t.text })),
        },
      });
      setHearingId(room.hearingId);
      setRoomCode(room.code);

      const state = await loadRoom({ data: { hearingId: room.hearingId } });
      setTurns(state.turns as RoomTurn[]);
      setParticipants(state.participants);
      void refetchHearings();
      void runSessionSummary(state.turns as RoomTurn[], 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duruşma açılamadı.");

    } finally {
      setBusy(null);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast.error("Geçerli bir katılım kodu girin.");
      return;
    }
    setBusy("join");
    try {
      const { hearingId: id } = await joinRoom({
        data: { code, role: userRole, displayName: myName },
      });
      await enterRoom(id, false);
      toast.success("Duruşmaya katıldınız; tutanak anlık güncellenecek.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duruşmaya katılınamadı.");
    } finally {
      setBusy(null);
    }
  }

  /** Var olan bir duruşmanın tam durumunu ekrana yükler. */
  async function enterRoom(id: string, owner: boolean) {
    const state = await loadRoom({ data: { hearingId: id } });
    const s = (state.hearing.setup ?? {}) as Partial<HearingSetup>;
    setHearingId(id);
    setRoomCode(state.hearing.code);
    setIsOwner(owner);
    setSetup({
      title: s.title || state.hearing.title,
      court: s.court || state.hearing.court,
      caseType: s.caseType || state.hearing.case_type,
      parties: s.parties ?? [],
      evidence: s.evidence ?? [],
      missing: s.missing ?? [],
    });
    setTurns(state.turns as RoomTurn[]);
    setParticipants(state.participants);
    setVerdict(state.hearing.verdict ?? "");
    setAppealNote("");
    setSessions([]);
  }

  /** Daha önce açılmış/katılınmış duruşmaya kaldığı yerden döner. */
  async function handleResume(h: {
    id: string;
    isOwner: boolean;
    myRole: string;
    caseType: string;
  }) {
    setBusy("resume");
    try {
      const role = USER_ROLES.find((r) => r.value === h.myRole)?.value;
      if (role) setUserRole(role);
      const ct = CASE_TYPES.find((c) => c.value === h.caseType)?.value;
      if (ct) setCaseType(ct);
      await enterRoom(h.id, h.isOwner);
      toast.success("Duruşmaya kaldığınız yerden döndünüz.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duruşma açılamadı.");
    } finally {
      setBusy(null);
    }
  }

  /** Salondan ayrılır ve giriş ekranına döner. */
  async function handleLeave() {
    if (hearingId) {
      try {
        await leaveRoom({ data: { hearingId } });
      } catch {
        /* sessizce geç */
      }
    }
    resetRoom();
    void refetchHearings();
  }

  function resetRoom() {
    setSetup(null);
    setTurns([]);
    setVerdict("");
    setAppealNote("");
    setSessions([]);
    setHearingId(null);
    setRoomCode("");
    setParticipants([]);
    setIsOwner(true);
    setTurnFilter("ALL");
  }

  /** Tutanağı resmî formatta indirir. */
  function handleExport() {
    if (!setup) return;
    const md = buildTranscriptMarkdown(
      {
        title: setup.title,
        court: setup.court,
        caseType: setup.caseType,
        code: roomCode || undefined,
        parties: setup.parties,
        evidence: setup.evidence,
        participants: participants.map(
          (p) => `${p.display_name || "Katılımcı"} (${USER_ROLES.find((r) => r.value === p.role)?.label ?? p.role})`,
        ),
      },
      turns.map((t) => ({
        speaker: t.speaker,
        role: t.role,
        action: t.action ? (ACTION_LABEL[t.action as CourtAction] ?? t.action) : null,
        text: t.text,
        created_at: (t as { created_at?: string }).created_at,
      })),
      [
        ...sessions.map((x) => `## ${x.no}. CELSE ÖZETİ\n\n${x.text}`),
        verdict || "",
        appealNote ? `## KANUN YOLU DEĞERLENDİRMESİ\n\n${appealNote}` : "",
      ]
        .filter(Boolean)
        .join("\n\n---\n\n") || undefined,
    );
    downloadText(`${slugifyFilename(setup.title)}-tutanak.md`, md);
    toast.success("Tutanak indirildi.");
  }

  function handleCopyTranscript() {
    if (!setup) return;
    const text = turns.map((t) => `${t.speaker}: ${t.text}`).join("\n\n");
    navigator.clipboard?.writeText(text);
    toast.success("Tutanak panoya kopyalandı.");
  }

  /** Karar sonrası kanun yolu değerlendirmesi ister. */
  async function handleAppeal() {
    if (!verdict) return;
    setBusy("appeal");
    try {
      const res = await appeal({
        data: {
          caseType,
          userRole,
          transcript: turns.map((t) => ({ role: t.role, speaker: t.speaker, text: t.text })),
          verdict,
        },
      });
      setAppealNote(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Değerlendirme oluşturulamadı.");
    } finally {
      setBusy(null);
    }
  }


  async function handleSpeak() {
    const text = word.trim();
    if (!text) return;
    if (!canPerform(userRole, action)) {
      toast.error(`Bu sıfatla "${ACTION_LABEL[action]}" işlemi yapılamaz.`);
      return;
    }
    const role: HearingTurn["role"] =
      userRole === "HAKIM" ? "HAKIM" : userRole === "SAVCI" ? "SAVCI" : "TARAF";
    const mineText = `[${ACTION_LABEL[action]}] ${text}`;
    setWord("");
    setBusy("turn");
    try {
      let next: RoomTurn[] = [...turns, { role, speaker: myName, text: mineText, mine: true }];
      if (hearingId) {
        const saved = await appendTurns({
          data: {
            hearingId,
            turns: [{ role, speaker: myName, action, text: mineText, mine: true }],
          },
        });

        mergeTurns(saved.turns as RoomTurn[]);
        next = [...turns, ...(saved.turns as RoomTurn[])];
      } else {
        setTurns(next);
      }

      const res = await cont({
        data: {
          ...payload,
          action,
          transcript: next.map((t) => ({ role: t.role, speaker: t.speaker, text: t.text })),
          userStatement: text,
        },
      });

      if (hearingId) {
        const savedAi = await appendTurns({
          data: {
            hearingId,
            turns: res.turns.map((t) => ({ role: t.role, speaker: t.speaker, text: t.text })),
          },
        });
        mergeTurns(savedAi.turns as RoomTurn[]);
        void runSessionSummary(
          [...next, ...(savedAi.turns as RoomTurn[])],
          sessions.length + 1,
        );
      } else {
        const merged = [...next, ...res.turns] as RoomTurn[];
        setTurns(merged);
        void runSessionSummary(merged, sessions.length + 1);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duruşma devam ettirilemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function handleVerdict() {
    if (!canClose) {
      toast.error("Tanık sıfatıyla karar talep edilemez; kararı hâkim tefhim eder.");
      return;
    }
    setBusy("verdict");
    try {
      const res = await close({
        data: {
          caseFileId: caseFileId || undefined,
          caseType,
          userRole,
          transcript: turns.map((t) => ({ role: t.role, speaker: t.speaker, text: t.text })),
        },
      });
      setVerdict(res.text);
      if (hearingId && isOwner) {
        await saveVerdict({ data: { hearingId, verdict: res.text } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Karar oluşturulamadı.");
    } finally {
      setBusy(null);

    }
  }


  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Ana sayfa
        </Link>
        {setup && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleExport} title="Tutanağı indir">
              <Download className="size-4" /> Tutanak
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLeave} title="Salondan ayrıl">
              <LogOut className="size-4" /> Ayrıl
            </Button>
            <Button variant="ghost" size="sm" onClick={resetRoom}>
              Yeni duruşma
            </Button>
          </div>
        )}

      </div>

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/50">
            <Gavel className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sanal Duruşma Salonu</h1>
            <p className="text-sm text-muted-foreground">
              Yalnızca sizin belgeleriniz ve beyanınız üzerinden yürüyen gerçekçi bir yargılama
              provası.
            </p>
          </div>
        </div>
      </header>

      {!setup ? (
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Dava dosyası (opsiyonel)</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCaseFileId("")}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  caseFileId === "" ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                Dosyasız (sadece beyan)
              </button>
              {(caseFiles ?? []).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCaseFileId(f.id)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    caseFileId === f.id ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {f.title}
                </button>
              ))}
            </div>
            {(caseFiles ?? []).length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Henüz dava dosyanız yok. Sohbet ekranındaki “Dava Dosyalarım” bölümünden belge
                yükleyebilirsiniz.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Dava türü</label>
              <div className="flex flex-wrap gap-2">
                {CASE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setCaseType(t.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      caseType === t.value ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Duruşmadaki sıfatınız</label>
              <div className="flex flex-wrap gap-2">
                {USER_ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setUserRole(r.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      userRole === r.value ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <Lock className="size-3" /> Yetkili işlemler:{" "}
                {allowedActions.map((a) => ACTION_LABEL[a]).join(" · ")}
              </p>
            </div>

          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tutanakta görünecek adınız
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Örn. Av. Ayşe Yılmaz"
              maxLength={80}
              className="max-w-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Boş bırakırsanız tutanakta “Siz” olarak görünürsünüz.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Olayı kendi cümlelerinizle anlatın
            </label>
            <Textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={6}
              placeholder="Taraflar, olayın gelişimi, talebiniz ve elinizdeki deliller…"
            />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Simülasyon yalnızca yazdıklarınız ve
              yüklediğiniz belgelerle sınırlıdır; uydurma delil veya karar üretilmez.
            </p>
          </div>


          <Button onClick={handleOpen} disabled={busy !== null} size="lg">
            {busy === "open" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Gavel className="size-4" />
            )}
            Duruşmayı aç
          </Button>

          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Radio className="size-4 text-primary" /> Devam eden bir duruşmaya katılın
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Katılım kodunu girin; seçtiğiniz sıfatla salona girer, yeni beyan, itiraz ve
              delilleri anlık görürsünüz.
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ÖRN. K7M2QP"
                className="max-w-[200px] font-mono tracking-widest"
                maxLength={12}
              />
              <Button variant="outline" onClick={handleJoin} disabled={busy !== null}>
                {busy === "join" ? <Loader2 className="size-4 animate-spin" /> : null} Katıl
              </Button>
            </div>
          </div>

          {(pastHearings?.hearings ?? []).length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <History className="size-4 text-primary" /> Geçmiş duruşmalarım
              </p>
              <ul className="space-y-2">
                {(pastHearings?.hearings ?? []).map((h) => (
                  <li
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{h.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {h.court || "Mahkeme belirtilmedi"} ·{" "}
                        {USER_ROLES.find((r) => r.value === h.myRole)?.label ?? h.myRole} ·{" "}
                        <span className="font-mono tracking-widest">{h.code}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={h.hasVerdict ? "secondary" : "outline"}>
                        {h.hasVerdict ? "Karar verildi" : "Devam ediyor"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => handleResume(h)}
                      >
                        Devam et
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{setup.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {setup.court} · {setup.caseType}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <HearingNotificationSettings
                  prefs={notifPrefs}
                  update={updateNotifPrefs}
                  activeCount={activeCount}
                />
                {roomCode && (
                  <>

                  <Badge variant="secondary" className="gap-1">
                    <Radio className="size-3 animate-pulse text-primary" /> Canlı
                  </Badge>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(roomCode);
                      toast.success("Katılım kodu kopyalandı.");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-mono text-sm tracking-widest hover:bg-muted"
                    title="Katılım kodunu kopyala"
                  >
                    {roomCode} <Copy className="size-3.5" />
                  </button>
                  </>
                )}
              </div>
            </div>

            {participants.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-3.5" /> Salondakiler:
                {participants.map((p) => (
                  <Badge key={p.user_id} variant="outline">
                    {p.display_name ? `${p.display_name} · ` : ""}
                    {USER_ROLES.find((r) => r.value === p.role)?.label ?? p.role}
                  </Badge>
                ))}
              </div>
            )}

            {/* Celse safhası göstergesi */}
            <div className="no-scrollbar mt-4 flex items-center gap-1 overflow-x-auto">
              {PHASES.map((p, i) => (
                <span
                  key={p.key}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${
                    i === phaseIndex
                      ? "border-primary bg-primary/10 font-medium text-foreground"
                      : i < phaseIndex
                        ? "border-border bg-muted/60 text-muted-foreground"
                        : "border-dashed border-border text-muted-foreground/70"
                  }`}
                >
                  {i + 1}. {p.label}
                </span>
              ))}
            </div>

            {setup.parties.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                {setup.parties.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
            {setup.evidence.length > 0 && (
              <div className="mt-3 text-sm">
                <span className="font-medium">Dosyadaki deliller: </span>
                {setup.evidence.join(", ")}
              </div>
            )}
            {setup.missing.length > 0 && (
              <div className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Eksik görünen: </span>
                {setup.missing.join(", ")}
              </div>
            )}
          </div>

          {/* Hızlı filtre — mobilde yatay kaydırmalı, üstte sabit */}
          <div className="sticky top-0 z-10 -mx-4 border-b border-border/70 bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-3">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {(
                [
                  ["ALL", "Tümü"],
                  ["BEYAN", "Beyan"],
                  ["ITIRAZ", "İtiraz"],
                  ["DELIL", "Delil"],
                  ["KARAR", "Karar"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTurnFilter(key)}
                  aria-pressed={turnFilter === key}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    turnFilter === key
                      ? "border-primary bg-primary/10 font-medium text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {label}
                  <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {turnCounts[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {visibleTurns.length === 0 && turns.length > 0 && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Bu filtrede kayıt yok.
              </p>
            )}
            {visibleTurns.map((t, i) => {
              const style =
                t.mine || t.speaker === myName || t.speaker === "Siz"
                  ? ROLE_STYLE.SIZ
                  : (ROLE_STYLE[t.role] ?? ROLE_STYLE.TARAF);
              const kind = turnKind(t);
              return (
                <article
                  key={t.id ?? `${i}-${t.speaker}`}
                  className={`rounded-xl border p-3 sm:p-4 ${style.className}`}
                >
                  <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
                    <Scale className="size-3.5 shrink-0" />
                    <span className="truncate">{t.speaker || style.label}</span>
                    <span className="truncate font-normal normal-case text-muted-foreground">
                      {style.label}
                    </span>
                    <span className="ml-auto shrink-0 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[10px] font-medium normal-case text-muted-foreground">
                      {kind === "BEYAN"
                        ? "Beyan"
                        : kind === "ITIRAZ"
                          ? "İtiraz"
                          : kind === "DELIL"
                            ? "Delil"
                            : "Karar"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed sm:text-sm">
                    {t.text}
                  </p>
                </article>
              );
            })}
            {busy === "turn" && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Duruşma sürüyor…
              </p>
            )}
          </div>

          {sessions.length > 0 && turnFilter === "ALL" && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="size-3.5" /> Celse özetleri (kaynaklı)
                {summaryBusy && <Loader2 className="size-3.5 animate-spin" />}
              </h2>
              {sessions.map((s) => (
                <article
                  key={s.no}
                  className="rounded-xl border border-border bg-muted/30 p-4 text-[15px] leading-relaxed sm:p-5 sm:text-sm"
                >
                  <p className="whitespace-pre-wrap break-words">{s.text}</p>
                  <CitationsList text={s.text} />
                </article>
              ))}
            </section>
          )}

          {summaryBusy && sessions.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Celse özeti hazırlanıyor…
            </p>
          )}

          {verdict && (turnFilter === "ALL" || turnFilter === "KARAR") && (
            <>
              <article className="whitespace-pre-wrap break-words rounded-xl border border-primary/40 bg-primary/5 p-4 text-[15px] leading-relaxed sm:p-5 sm:text-sm">
                {verdict}
              </article>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="size-4" /> Tutanağı indir
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                  <Copy className="size-4" /> Tutanağı kopyala
                </Button>
                <Button size="sm" onClick={handleAppeal} disabled={busy !== null}>
                  {busy === "appeal" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  Kanun yolu değerlendirmesi
                </Button>
              </div>
              {appealNote && (
                <article className="rounded-xl border border-border bg-muted/40 p-4 text-[15px] leading-relaxed sm:p-5 sm:text-sm">
                  <p className="whitespace-pre-wrap break-words">{appealNote}</p>
                  <CitationsList text={appealNote} />
                </article>
              )}
            </>
          )}


          <div ref={endRef} />

          {!atBottom && (
            <button
              type="button"
              onClick={scrollToEnd}
              className="fixed bottom-40 right-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur sm:bottom-44"
            >
              <ArrowDown className="size-4" /> Son söze in
            </button>
          )}


          <div className="safe-bottom sticky bottom-0 space-y-2 border-t border-border bg-background/95 py-3 backdrop-blur">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
              <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:inline">
                Usulî işlem:
              </span>
              {(["BEYAN", "ITIRAZ", "DELIL", "SORU", "MUTALAA", "TANIK_CEVAP", "ARA_KARAR"] as CourtAction[]).map(
                (a) => {
                  const allowed = canPerform(userRole, a);
                  return (
                    <button
                      key={a}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setAction(a)}
                      title={
                        allowed
                          ? ACTION_HINT[a]
                          : "Bu işlem sıfatınızın yetkisinde değil (usul yetkisi)."
                      }
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs ${
                        action === a && allowed
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border"
                      } ${allowed ? "" : "cursor-not-allowed opacity-40"}`}
                    >
                      {!allowed && <Lock className="size-3" />}
                      {ACTION_LABEL[a]}
                    </button>
                  );
                },
              )}
            </div>
            <Textarea
              value={word}
              onChange={(e) => setWord(e.target.value)}
              rows={3}
              disabled={!canSpeak}
              placeholder={
                canSpeak
                  ? ACTION_HINT[action]
                  : "Bu sıfatla duruşmada söz alınamaz; yalnızca sorulan soru cevaplanabilir."
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSpeak();
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSpeak} disabled={busy !== null || !word.trim() || !canSpeak}>
                <Send className="size-4" /> {ACTION_LABEL[action]}
              </Button>
              <Button
                variant="outline"
                onClick={handleVerdict}
                disabled={busy !== null || !canClose}
                title={
                  canClose
                    ? undefined
                    : "Karar isteme yetkiniz yok; kararı yalnızca hâkim tefhim eder."
                }
              >
                {busy === "verdict" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Gavel className="size-4" />
                )}
                {userRole === "HAKIM"
                  ? "Kararı tefhim et (taslak)"
                  : "Hâkimden karar iste (taslak)"}
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3" /> Yetki kontrolü aktif: yalnızca sıfatınızın
              yapabileceği usulî işlemler açıktır.
            </p>
          </div>

        </section>
      )}
    </div>
  );
}
