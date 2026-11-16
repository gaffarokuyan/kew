import strings from "@/content/strings.json";
import { courseId } from "./course";
import { getS, useStore } from "./store";

export const LANGS = strings.LANGS as [string, string, string][];
export const T = strings.T as Record<string, (string | string[])[]>;
const LI = () => Math.max(0, ["tr", "en", "de"].indexOf(getS().lang || "tr"));

/** Pick the current language out of a "tr|en|de" string. */
export const M = (s?: string | null) => { if (s == null) return ""; const p = String(s).split("|"); return p[LI()] ?? p[0]; };
export function t(k: string, v: Record<string, string | number> = {}): string {
  const row = T[k]; if (!row) return k;
  let s = (row[LI()] ?? row[0]) as string;
  if (typeof s !== "string") return k;
  for (const [a, b] of Object.entries(v)) s = s.split(`{${a}}`).join(String(b));
  const c = courseId();
  return c === "zza" ? toZza(s) : c === "ckb" ? toCkb(s) : s;
}
export const tArr = (k: string): string[] => { const row = T[k]; return (row?.[LI()] ?? row?.[0] ?? []) as string[]; };
export const t2 = (k: string) => t(k).split("|");
export const locale = () => (["tr", "en", "de"][LI()] as "tr" | "en" | "de");
/** Re-render when the base language changes. */
export const useLang = () => useStore((s) => s.lang);
/** Upper-case with the right rules for the interface language (Turkish i → İ). */
export const up = (s: string) => s.toLocaleUpperCase(locale() === "tr" ? "tr-TR" : locale() === "de" ? "de-DE" : "en-US");
/** Kurmancî upper-case: i → I, î → Î (never the Turkish İ). */
export const kuUp = (s: string) => s.toLocaleUpperCase("en-US");
/** Interface strings name the course language; for the Zazaki course swap Kurmancî/Kurmanji for Kirmanckî/Zazaki. */
function toZza(s: string) {
  return s.replace(/Kurmancî/g, "Kirmanckî").replace(/Kurmanji/g, "Zazaki").replace(/Kürtçe \(Kirmanckî\)/g, "Zazaca (Kirmanckî)");
}
/** Interface strings for the Soranî course. */
function toCkb(s: string) {
  return s.replace(/Kurmancî/g, "Soranî").replace(/Kurmanji/g, "Sorani");
}
