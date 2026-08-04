import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { readSharedThread } from "@/lib/shares.functions";
import { Scale, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/paylas/$token")({
  head: () => ({
    meta: [
      { title: "Paylaşılan Dosya — Hukuk Asistanı" },
      { name: "description", content: "Paylaşılan hukuki sohbetin salt-okunur görünümü." },
      { property: "og:title", content: "Paylaşılan Hukuki Sohbet" },
      { property: "og:description", content: "Salt-okunur paylaşım linki." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SharedPage,
});

function SharedPage() {
  const { token } = Route.useParams();
  const readFn = useServerFn(readSharedThread);
  const q = useQuery({
    queryKey: ["shared", token],
    queryFn: () => readFn({ data: { token } }),
  });

  if (q.isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }
  const data = q.data;
  if (!data || !data.ok) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-8 h-8 mx-auto text-destructive mb-2" />
          <h1 className="font-serif text-xl mb-1">Paylaşım geçersiz</h1>
          <p className="text-sm text-muted-foreground">
            Bu link iptal edilmiş veya süresi dolmuş olabilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <span className="font-serif">Hukuk Asistanı</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            Salt-okunur paylaşım
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4 p-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200">
          <strong>KVKK / gizlilik:</strong> Bu içeriği paylaşan kişi paylaşımdan sorumludur.
          Salt-okunur bu görünüm hukuki tavsiye değildir.
        </div>
        <h1 className="text-xl font-serif mb-4">{data.thread.title}</h1>
        <div className="space-y-4">
          {data.messages.map((m) => (
            <div
              key={m.id}
              className={
                "p-3 rounded-lg border " +
                (m.role === "user" ? "border-primary/30 bg-primary/5" : "border-border bg-card")
              }
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {m.role === "user" ? "Kullanıcı" : "Asistan"}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {m.parts
                  .filter((p) => p.type === "text")
                  .map((p) => p.text ?? "")
                  .join("")}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
