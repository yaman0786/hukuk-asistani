export type Theme = "light" | "dark";

export const THEME_KEY = "hukuk-ai-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(THEME_KEY);
  return v === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const next: Theme = getStoredTheme() === "dark" ? "light" : "dark";
  setTheme(next);
}

/** Inline script string injected into <head> to prevent flash of wrong theme. */
export const THEME_BOOT_SCRIPT = `
(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='dark'){t='light';}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();
`;
