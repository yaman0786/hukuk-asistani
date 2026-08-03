import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Türkiye Hukuk Master AI — iOS / Android native kabuk.
 *
 * Uygulama sunucu tarafı (AI, veritabanı, RAG) gerektirdiği için native kabuk,
 * yayındaki web uygulamasını yükler. Böylece mağaza güncellemesi beklemeden
 * her yeni sürüm anında telefonlara yansır.
 */
const config: CapacitorConfig = {
  appId: "com.ozcanyaman.hukukasistani",
  appName: "Hukuk Master AI",
  // This is a TanStack Start SSR app; the native shell must load the deployed
  // server so server functions, auth and streamed AI responses are available.
  webDir: "public",
  server: {
    url: "https://droit-navigator.lovable.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#faf7f0",
  },
  android: {
    backgroundColor: "#faf7f0",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#faf7f0",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#faf7f0",
      overlaysWebView: false,
    },
  },
};

export default config;
