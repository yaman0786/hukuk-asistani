import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Scale, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDisclaimerStatus, acceptDisclaimer } from "@/lib/threads.functions";

export function DisclaimerModal() {
  const qc = useQueryClient();
  const getFn = useServerFn(getDisclaimerStatus);
  const acceptFn = useServerFn(acceptDisclaimer);
  const [confirmed, setConfirmed] = useState(false);

  const statusQ = useQuery({
    queryKey: ["disclaimer-status"],
    queryFn: () => getFn(),
    staleTime: Infinity,
  });

  const acceptMut = useMutation({
    mutationFn: () => acceptFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disclaimer-status"] }),
  });

  if (statusQ.isLoading || !statusQ.data) return null;
  if (statusQ.data.accepted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-foreground">
              Hukuki Uyarı ve KVKK Aydınlatması
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Kullanmaya başlamadan önce lütfen okuyup onaylayın.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 text-sm text-foreground/85 max-h-[55vh] overflow-y-auto">
          <div className="flex gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Bu uygulama hukuki tavsiye veya avukatlık hizmeti sunmaz.</strong> Verilen
              bilgiler yalnızca <strong>genel bilgilendirme</strong> amaçlıdır ve somut olayınıza
              uygulanabilirliği garanti edilmez. 1136 sayılı Avukatlık Kanunu uyarınca avukatlık
              faaliyetleri yalnızca baroya kayıtlı avukatlarca yürütülebilir.
            </div>
          </div>

          <ul className="space-y-2 text-xs leading-relaxed list-disc pl-5">
            <li>
              Model, kanun maddesi veya mahkeme kararı <strong>yanlış aktarabilir</strong>.
              Kullanmadan önce mevzuatı ve içtihatları resmî kaynaklardan (mevzuat.gov.tr,
              karararama.yargitay.gov.tr) doğrulayın.
            </li>
            <li>
              Ciddi hak kayıpları, süreye bağlı işlemler ve dava süreçleri için mutlaka baroya
              kayıtlı bir <strong>avukata danışın</strong>.
            </li>
            <li>
              Sohbet içeriğiniz KVKK kapsamında işlenir; hesabınızı sildiğinizde tüm verileriniz
              kalıcı olarak silinir. Ayrıntı için{" "}
              <a href="/kvkk" target="_blank" className="underline text-primary">
                KVKK Aydınlatma Metni
              </a>
              .
            </li>
            <li>
              Kişisel veri (T.C. Kimlik No, banka bilgileri vb.) veya karşı tarafın hassas
              verilerini paylaşırken dikkatli olun; paylaştığınız veriler modele iletilir.
            </li>
          </ul>

          <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-xs leading-relaxed">
              Okuyup anladım. Bu sistemin <strong>hukuki tavsiye niteliği taşımadığını</strong> ve
              önemli kararlarımda mutlaka bir avukata danışmam gerektiğini kabul ediyorum.
            </span>
          </label>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <a
            href="/kullanim-sartlari"
            target="_blank"
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Kullanım Şartları
          </a>
          <Button
            variant="hukuk"
            disabled={!confirmed || acceptMut.isPending}
            onClick={() => acceptMut.mutate()}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {acceptMut.isPending ? "Kaydediliyor..." : "Kabul Et ve Devam Et"}
          </Button>
        </div>
      </div>
    </div>
  );
}
