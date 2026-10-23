import { useColorScheme } from "react-native";

/* Neutral, Duolingo-grade palette: white paper, grey #E5E5E5 strokes, warm dark text; Kurdish-flag colours only as accents. */
const light = {
  bg: "#ffffff", surface: "#ffffff", surface2: "#f1f3f1", line: "#e5e5e5", line2: "#d4d4d4",
  ink: "#3c3c3c", muted: "#777777", faint: "#afafaf",
  kesk: "#1f9d55", keskDeep: "#16783f", keskSoft: "#e3f5e9",
  zer: "#f7b500", zerDeep: "#c98d00", zerSoft: "#fff6d6",
  sor: "#e5483d", sorDeep: "#b9342b", sorSoft: "#ffe3e0",
  sky: "#1cb0f6", skySoft: "#ddf4ff", locked: "#e5e5e5", lockedDeep: "#afafaf", shadow: "rgba(0,0,0,0.08)", dark: false,
};
const dark: typeof light = {
  bg: "#131f24", surface: "#131f24", surface2: "#202f36", line: "#37464f", line2: "#52656d",
  ink: "#f1f7fb", muted: "#9ba8ad", faint: "#52656d",
  kesk: "#2fbf6a", keskDeep: "#1e8a4a", keskSoft: "#1a3a2a",
  zer: "#ffc800", zerDeep: "#d9a400", zerSoft: "#3b3418",
  sor: "#ff5a4e", sorDeep: "#c9433a", sorSoft: "#3d2321",
  sky: "#49c0f8", skySoft: "#16384a", locked: "#37464f", lockedDeep: "#52656d", shadow: "rgba(0,0,0,0.4)", dark: true,
};
export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === "dark" ? dark : light);

export const F = {
  display: "Baloo2_800ExtraBold", displaySemi: "Baloo2_600SemiBold",
  body: "Nunito_700Bold", bodyHeavy: "Nunito_800ExtraBold", bodySemi: "Nunito_600SemiBold",
};
/** Darken a hex colour (for 3D button bottoms). */
export function shade(hex: string, f = 0.72) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
