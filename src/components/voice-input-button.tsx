import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";

// Web Speech API is unprefixed in Chrome/Edge/Safari via webkit
type SpeechRecognitionCtor = new () => any;
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function VoiceInputButton() {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) setSupported(false);
    return () => {
      try {
        recRef.current?.stop?.();
      } catch {
        // Recognition may already be stopped during unmount.
      }
    };
  }, []);

  function findTextarea(): HTMLTextAreaElement | null {
    const form = wrapRef.current?.closest("form");
    return (form?.querySelector("textarea") as HTMLTextAreaElement | null) ?? null;
  }

  function appendText(text: string) {
    const ta = findTextarea();
    if (!ta) return;
    const current = ta.value ?? "";
    const sep = current && !current.endsWith(" ") ? " " : "";
    const next = current + sep + text;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(ta, next);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
  }

  function start() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Tarayıcınız sesli girişi desteklemiyor.");
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = "tr-TR";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        let finalText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
        }
        if (finalText.trim()) appendText(finalText.trim());
      };
      rec.onerror = (e: any) => {
        if (e.error === "not-allowed") toast.error("Mikrofon izni verilmedi.");
        else if (e.error !== "aborted") toast.error("Ses tanıma hatası.");
        setListening(false);
      };
      rec.onend = () => setListening(false);
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      toast.error("Ses tanıma başlatılamadı.");
      setListening(false);
    }
  }

  function stop() {
    try {
      recRef.current?.stop?.();
    } catch {
      // Recognition may already have ended.
    }
    setListening(false);
  }

  if (!supported) return null;

  return (
    <span ref={wrapRef} className="inline-flex">
      <PromptInputButton
        variant={listening ? "default" : "ghost"}
        onClick={() => (listening ? stop() : start())}
        aria-label={listening ? "Dinlemeyi durdur" : "Sesli giriş"}
        title={listening ? "Dinlemeyi durdur" : "Sesli giriş (Türkçe)"}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </PromptInputButton>
    </span>
  );
}
