import cards from "@/content/culture.json";

export type CultureCard = { id: string; title: string; ku: string; text: string; quiz: { q: string; o: string[]; a: number }[] };
export const CULTURE = cards as CultureCard[];
/** One card per week, the same for everyone (week number since 2026-01-05, a Monday). */
export const weekCard = () => CULTURE[Math.floor((Date.now() - Date.UTC(2026, 0, 5)) / (7 * 864e5)) % CULTURE.length];
