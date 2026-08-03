import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "hukuk-ai-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* noop */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "accepted");
    } catch {
      /* noop */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 pointer-events-none">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card/95 backdrop-blur shadow-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-center pointer-events-auto">
        <p className="text-xs text-foreground/80 flex-1">
          Bu uygulama, hizmetin çalışması ve oturum yönetimi için zorunlu çerezler kullanır.
          Detaylar için{" "}
          <Link to="/gizlilik" className="underline hover:text-primary">
            Gizlilik Politikası
          </Link>{" "}
          ve{" "}
          <Link to="/kvkk" className="underline hover:text-primary">
            KVKK Aydınlatma Metni
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-2 hover:bg-primary/90"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
