import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Beta auth.oauth namespace — narrow local typing so TypeScript is happy.
type OAuthResult = {
  data?: {
    client?: { name?: string; redirect_uris?: string[] } | null;
    redirect_url?: string;
    redirect_to?: string;
    scopes?: string[];
  } | null;
  error?: { message: string } | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("authorization_id eksik");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl mb-2">Yetkilendirme yüklenemedi</h1>
        <p className="text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "harici uygulama";
  const scopes = details?.scopes ?? [];

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Yetkilendirme sunucusu bir yönlendirme URL'si döndürmedi.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background text-foreground">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/assets/hukuk-mark.svg" alt="Hukuk Asistanı" width={56} height={56} className="mb-3" />
          <h1 className="font-serif text-2xl leading-tight">
            {clientName} uygulamasına erişim izni
          </h1>
          <p className="text-xs text-muted-foreground mt-2">Hukuk Asistanı</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <p className="text-sm">
            <span className="font-medium">{clientName}</span>, hesabınıza sizin adınıza bağlanmak ve
            etkinleştirilen araçları kullanmak istiyor.
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>Kendi sohbet dosyalarınızı listeleme ve okuma</li>
            <li>Yeni sohbet dosyası oluşturma, yeniden adlandırma veya silme</li>
            <li>Başka bir kullanıcının verisine erişilemez</li>
          </ul>
          {scopes.length > 0 && (
            <div className="text-[11px] text-muted-foreground">
              İstenen kapsamlar: {scopes.join(", ")}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Bu izin, uygulamanın kendi erişim kurallarını ve RLS politikalarını geçersiz kılmaz.
          </p>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => decide(false)}
            >
              Reddet
            </Button>
            <Button
              type="button"
              variant="hukuk"
              className="flex-1"
              disabled={busy}
              onClick={() => decide(true)}
            >
              {busy ? "İşleniyor..." : "İzin Ver"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
