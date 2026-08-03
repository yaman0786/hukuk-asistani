/**
 * Native (Capacitor) kabuk yardımcıları.
 * Web tarayıcıda hiçbir şey yapmaz — tüm çağrılar güvenle no-op olur.
 */

let initialized = false;

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export async function initNativeShell() {
  if (initialized || !isNativeApp()) return;
  initialized = true;

  document.documentElement.classList.add("native-app");

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    /* eklenti yoksa yok say */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* eklenti yoksa yok say */
  }
}
