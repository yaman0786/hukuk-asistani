import { RECAPTCHA_SITE_KEY } from "@/config/recaptcha";

const SCRIPT_ID = "recaptcha-v3-script";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loadingPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve();
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      const iv = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(iv);
          resolve();
        }
      }, 50);
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("reCAPTCHA yüklenemedi"));
    document.head.appendChild(s);
  });
  return loadingPromise;
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!RECAPTCHA_SITE_KEY) return null;
  try {
    await loadScript();
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, {
            action,
          });
          resolve(token);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch {
    return null;
  }
}
