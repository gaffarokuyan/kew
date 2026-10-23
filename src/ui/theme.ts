import { useColorScheme } from "react-native";

const light = {
  bg: "#f3f6f2", surface: "#ffffff", surface2: "#e8eee6", line: "#d6dfd3", line2: "#c3cfbf",
  ink: "#15241a", muted: "#5b6d61", faint: "#8a9a8f",
  kesk: "#1f8a4c", keskDeep: "#156638", keskSoft: "#d8f0df",
  zer: "#f5b400", zerDeep: "#c98d00", zerSoft: "#fff3c9",
  sor: "#d2342c", sorDeep: "#a32520", sorSoft: "#fde1de",
  sky: "#1c8fc7", skySoft: "#d9eef8", locked: "#cfd8cc", lockedDeep: "#adb9a9", shadow: "rgba(20,40,26,0.12)", dark: false,
};
const dark: typeof light = {
  bg: "#0e1611", surface: "#17221a", surface2: "#1f2e24", line: "#2a3b2f", line2: "#36493b",
  ink: "#e8f1e9", muted: "#9fb3a4", faint: "#6f8475",
  kesk: "#2fae64", keskDeep: "#1c7a43", keskSoft: "#1b3826",
  zer: "#ffc629", zerDeep: "#c99600", zerSoft: "#3a3116",
  sor: "#ef5a50", sorDeep: "#b33a32", sorSoft: "#3c1f1c",
  sky: "#45b3e6", skySoft: "#173243", locked: "#2f4034", lockedDeep: "#223026", shadow: "rgba(0,0,0,0.4)", dark: true,
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
