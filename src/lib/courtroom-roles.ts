/** İstemci ve sunucu tarafında ortak kullanılan duruşma rol/yetki tanımları. */

export const USER_ROLE_LABEL: Record<string, string> = {
  HAKIM: "Hâkim",
  SAVCI: "Cumhuriyet savcısı",
  DAVACI: "Davacı",
  DAVALI: "Davalı",
  SANIK: "Sanık",
  KATILAN: "Katılan / müşteki",
  TANIK: "Tanık",
  VEKIL: "Vekil (avukat)",
};

/** Duruşmada yapılabilecek usulî işlemler. */
export type CourtAction =
  | "BEYAN"
  | "ITIRAZ"
  | "DELIL"
  | "SORU"
  | "MUTALAA"
  | "TANIK_CEVAP"
  | "ARA_KARAR"
  | "KARAR"
  | "KARAR_TALEBI";

export const ACTION_LABEL: Record<CourtAction, string> = {
  BEYAN: "Beyanda bulun",
  ITIRAZ: "İtiraz et",
  DELIL: "Delil sun",
  SORU: "Soru sor",
  MUTALAA: "Mütalaa ver",
  TANIK_CEVAP: "Soruyu cevapla",
  ARA_KARAR: "Ara karar kur",
  KARAR: "Kararı tefhim et",
  KARAR_TALEBI: "Hâkimden karar iste",
};

export const ACTION_HINT: Record<CourtAction, string> = {
  BEYAN: "Esas hakkında veya usule ilişkin beyanınızı yazın.",
  ITIRAZ: "İtirazınızı ve hukuki dayanağını yazın.",
  DELIL: "Sunduğunuz delili ve neyi ispatladığını yazın.",
  SORU: "Soruyu ve kime yöneltildiğini yazın.",
  MUTALAA: "Esas hakkındaki mütalaanızı yazın.",
  TANIK_CEVAP: "Hâkimin/tarafların sorusuna cevabınızı yazın.",
  ARA_KARAR: "Kuracağınız ara kararı yazın.",
  KARAR: "Hükmünüzü ve kısa gerekçesini yazın.",
  KARAR_TALEBI: "Karar verilmesine ilişkin talebinizi yazın.",
};

/** Hangi sıfattaki kullanıcı hangi işlemi yapabilir. */
export const ROLE_PERMISSIONS: Record<string, CourtAction[]> = {
  HAKIM: ["SORU", "ARA_KARAR", "KARAR"],
  SAVCI: ["BEYAN", "MUTALAA", "SORU", "DELIL", "KARAR_TALEBI"],
  VEKIL: ["BEYAN", "ITIRAZ", "DELIL", "SORU", "KARAR_TALEBI"],
  DAVACI: ["BEYAN", "DELIL", "KARAR_TALEBI"],
  DAVALI: ["BEYAN", "DELIL", "KARAR_TALEBI"],
  SANIK: ["BEYAN", "ITIRAZ", "DELIL", "KARAR_TALEBI"],
  KATILAN: ["BEYAN", "DELIL", "KARAR_TALEBI"],
  TANIK: ["TANIK_CEVAP"],
};

export function canPerform(userRole: string, action: CourtAction): boolean {
  return (ROLE_PERMISSIONS[userRole] ?? []).includes(action);
}

/** Yetkisiz işlemi reddeder. */
export function assertCourtAction(userRole: string, action: CourtAction): void {
  if (!canPerform(userRole, action)) {
    throw new Error(
      `${USER_ROLE_LABEL[userRole] ?? "Bu sıfat"} duruşmada "${ACTION_LABEL[action]}" işlemini yapamaz.`,
    );
  }
}
