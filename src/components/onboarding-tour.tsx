import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Scale,
  FileText,
  Paperclip,
  BookOpen,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

const KEY = "hukuk-ai-onboarding-v1";

const STEPS = [
  {
    icon: Scale,
    title: "Türkiye Hukuk Master AI'ya Hoş Geldiniz",
    body: "Mevzuat, içtihat, dilekçe hazırlama ve dosya analizinde uzmanlaşmış bir hukuki asistan. Her cevap net kaynak atıflarıyla verilir.",
  },
  {
    icon: FileText,
    title: "Dosyalarım — Her Konu Kendi Oturumunda",
    body: "Sol menüden yeni bir 'Dosya' açın; her hukuki sorununuz için ayrı bir oturum oluşturun. Konuşmalar otomatik kaydedilir, klasörlere alınabilir, arşivlenir.",
  },
  {
    icon: Paperclip,
    title: "PDF ve Görsel Yükleyin",
    body: "Ataç simgesinden PDF, JPG, PNG dosyaları yükleyip içeriğini analiz ettirebilirsiniz. Sözleşme, karar, dilekçe — her tür belgeyi inceleyebilir.",
  },
  {
    icon: BookOpen,
    title: "Şablonlar ve Rehberler Hazır",
    body: "Sol menüdeki 'Şablonlar' sekmesinde 18+ hazır dilekçe örneği bulunur. Rehberlerde 'Dilekçe Nasıl Yazılır', 'Maaş Bloke İtirazı' gibi pratik anlatımlar mevcut.",
  },
  {
    icon: Sparkles,
    title: "Cevabı İndirin",
    body: "Her yanıtı PDF, DOCX veya Markdown olarak indirebilirsiniz. Konuşmanın tamamını üstteki indirme simgesinden dışa aktarın.",
  },
  {
    icon: KeyRound,
    title: "Kısayollar",
    body: "⌘K / Ctrl+K komut paletini açar. Sesle giriş için mikrofon simgesine dokunun. Sağ üstten tema değişimi yapabilirsiniz.",
  },
  {
    icon: ShieldCheck,
    title: "Önemli Uyarı",
    body: "Bu sistem bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz. Kritik kararlar için mutlaka bir avukata danışın.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    setStep(0);
  }

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base">{current.title}</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>

        <div className="flex items-center gap-1.5 justify-center pt-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")
              }
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={close}>
            Atla
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Geri
              </Button>
            )}
            {!isLast ? (
              <Button variant="hukuk" size="sm" onClick={() => setStep(step + 1)}>
                İleri
              </Button>
            ) : (
              <Button variant="hukuk" size="sm" onClick={close} asChild>
                <Link to="/fiyatlar">Planları gör</Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
