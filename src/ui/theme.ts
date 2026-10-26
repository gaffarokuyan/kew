import { useColorScheme } from "react-native";

/*
 * "Kilim" palette. Light mode is a lime-washed village wall with walnut ink;
 * dark mode is the Zagros night (deep indigo, not black). Accents are the dyes of a
 * Kurdish kilim: mountain green, saffron, pomegranate, indigo, madder plum, turquoise tile.
 * Rule of thumb: the plain token is a fill (buttons, nodes, bars); the "Deep" token is the
 * same hue tuned to be readable as text on the page in that mode.
 */
const light = {
  bg: "#F7F5F0", surface: "#FFFFFF", surface2: "#EFEBE3", line: "#E2DCD0", line2: "#CFC6B6",
  ink: "#2A211B", muted: "#6B6157", faint: "#978D81",
  kesk: "#2F7A4B", keskDeep: "#1F5A36", keskSoft: "#E3EFE4",
  zer: "#E3A72F", zerDeep: "#855700", zerSoft: "#FBF0D6",
  sor: "#B83440", sorDeep: "#8C2230", sorSoft: "#F8E1DF",
  sky: "#34488F", skyDeep: "#283A78", skySoft: "#E4E8F4",
  plum: "#7A3D6B", turq: "#1F7A78", ochre: "#B8721A", walnut: "#6B4A2F", fire: "#D2601E",
  panel: "#26305C", panelInk: "#F6F0E4",
  locked: "#E6E0D5", lockedDeep: "#A49A8C", shadow: "rgba(42,33,27,0.10)", dark: false,
};
const dark: typeof light = {
  bg: "#161A2B", surface: "#1E2336", surface2: "#282E45", line: "#343B57", line2: "#4A5274",
  ink: "#F3EEE4", muted: "#B0AA9F", faint: "#7F7C8A",
  kesk: "#2F8253", keskDeep: "#8FD3A6", keskSoft: "#1D372B",
  zer: "#E8B341", zerDeep: "#F2C766", zerSoft: "#3A3020",
  sor: "#C2414B", sorDeep: "#F2959B", sorSoft: "#3E2229",
  sky: "#5367C2", skyDeep: "#AEBBF2", skySoft: "#262F55",
  plum: "#9A5185", turq: "#278C89", ochre: "#B87824", walnut: "#B88A62", fire: "#F08A3E",
  panel: "#232B52", panelInk: "#F6F0E4",
  locked: "#2A3047", lockedDeep: "#5B6280", shadow: "rgba(0,0,0,0.35)", dark: true,
};
export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === "dark" ? dark : light);

/*
 * Type: Alegreya (a calligraphic book serif with full Kurdish Latin coverage: ê î û ç ş) carries
 * headings and every Kurmancî word, so the language being learned always reads like a book.
 * Nunito stays for interface text and the base language.
 */
export const F = {
  display: "Alegreya_800ExtraBold", displaySemi: "Alegreya_700Bold", serif: "Alegreya_700Bold", italic: "Alegreya_500Medium_Italic", italicBold: "Alegreya_700Bold_Italic",
  body: "Nunito_700Bold", bodyHeavy: "Nunito_800ExtraBold", bodySemi: "Nunito_600SemiBold",
};
/** Modular type scale (≈1.25). */
export const TS = { xs: 13, sm: 15, md: 17, lg: 20, xl: 26, xxl: 34, hero: 46 } as const;

/** Darken a hex colour (for 3D button bottoms). */
export function shade(hex: string, f = 0.72) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
/** Hex colour with alpha (0–1). */
export const alpha = (hex: string, a: number) => hex + Math.round(a * 255).toString(16).padStart(2, "0");

/** The course content ships generic unit colours; translate them into kilim dyes. */
export function ucol(hex: string, th: Theme) {
  switch (hex.toLowerCase()) {
    case "#1f8a4c": return th.kesk;
    case "#1c8fc7": return th.sky;
    case "#8a4fbf": return th.plum;
    case "#d9822b": return th.ochre;
    case "#d24d7a": return th.sor;
    case "#138a87": return th.turq;
    default: return hex;
  }
}
/** One colour per CEFR level, used on the path, in the profile and in onboarding. */
export function levelCol(lvl: string, th: Theme) {
  const m: Record<string, string> = { A1: th.kesk, A2: th.sky, B1: th.plum, B2: th.turq, C1: th.ochre };
  return m[lvl] ?? th.walnut;
}
