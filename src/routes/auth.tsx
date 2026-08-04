import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { RECAPTCHA_SITE_KEY } from "@/config/recaptcha";

async function verifyHuman(action: string): Promise<boolean> {
  if (!RECAPTCHA_SITE_KEY) return true;
  const token = await getRecaptchaToken(action);
  if (!token) return true;
  try {
    const res = await fetch("/api/public/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" && s.next.length > 0 ? { next: s.next } : {},

  head: () => ({
    meta: [
      { title: "Giriş — Hukuk Asistanı" },
      {
        name: "description",
        content:
          "Türkiye hukuk sistemi için profesyonel yapay zekâ hukuk asistanı. Giriş yapın veya hesap oluşturun.",
      },
      { property: "og:title", content: "Giriş — Hukuk Asistanı" },
      {
        property: "og:description",
        content: "Hesabınıza giriş yapın veya kayıt olun; hukuki dosyalarınızı güvenle yönetin.",
      },
    ],
  }),
  component: AuthPage,
});

// Only same-origin relative paths are allowed as post-auth return targets.
function safeNext(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function AuthPage() {
  const { next } = Route.useSearch();
  const nextPath = safeNext(next ?? "");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.replace(nextPath);
    });
  }, [nextPath]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const okHuman = await verifyHuman(mode === "signup" ? "signup" : "signin");
      if (!okHuman) throw new Error("Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.");
      if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}${nextPath}`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (error) throw error;
        toast.success("Hesap oluşturuldu. Giriş yapabilirsiniz.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.replace(nextPath);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}${nextPath}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) throw error;
      // Supabase redirects the browser to Google. If it does not, stop the
      // spinner and show a useful error instead of leaving the button stuck.
      window.setTimeout(() => setLoading(false), 8000);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Google girişi başlatılamadı: ${err.message}`
          : "Google girişi başlatılamadı. Lütfen tekrar deneyin.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/assets/hukuk-mark.svg" alt="Hukuk Asistanı" width={72} height={72} className="mb-4" />
          <h1 className="font-serif text-3xl text-foreground leading-tight">
            Hukuk Asistanı
            <span className="block text-base font-normal text-muted-foreground mt-1">
              Profesyonel Hukuki Asistan
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Mevzuat, içtihat, dosya analizi ve dilekçe hazırlama için profesyonel Türkçe hukuki
            yapay zekâ asistanı.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex bg-muted rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm rounded-md transition ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm rounded-md transition ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="mt-1"
              />
            </div>
            <Button type="submit" variant="hukuk" className="w-full" disabled={loading}>
              {mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">veya</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Google ile devam et
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
          Bu asistan yalnızca bilgilendirme amaçlıdır. Verilen bilgiler hukuki nitelikte kesin görüş
          oluşturmaz.
        </p>
        {RECAPTCHA_SITE_KEY && (
          <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
            Bu site reCAPTCHA ile korunmaktadır ve Google{" "}
            <a
              href="https://policies.google.com/privacy"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Gizlilik Politikası
            </a>{" "}
            ile{" "}
            <a
              href="https://policies.google.com/terms"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Hizmet Şartları
            </a>{" "}
            geçerlidir.
          </p>
        )}
      </div>
    </div>
  );
}
