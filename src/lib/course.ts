import data from "@/content/course.json";

export type Meaning = string; // "tr|en|de"
export type WordRow = [string, Meaning, string?];
export type SentRow = [string, Meaning];
export type StoryLine = [string, string, Meaning, { q: Meaning; options: string[] }?];
export type Unit = {
  id: string; ku: string; col: string; name: Meaning; words: WordRow[]; sents: SentRow[];
  tips?: [string, Meaning][]; note?: Meaning; story?: { title: string; lines: StoryLine[] }; si: number;
};
export type Level = "A1" | "A2" | "B1";
export type Section = { lvl: Level; name: Meaning; sub: Meaning; units: Omit<Unit, "si">[] };
export type Char = { c: string; hair: string; g: "m" | "f"; scarf?: string; moust?: number };
export type NodeT = { id: string; unit: string; ui: number; type: "learn" | "sent" | "story" | "chest"; range?: [number, number]; k?: number };
export type Word = { ku: string; m: Meaning; pic: string | null; unit: string };

export const SECTIONS = data.SECTIONS as unknown as Section[];
export const CHARS = data.CHARS as unknown as Record<string, Char>;
export const SAYINGS = data.SAYINGS as unknown as SentRow[];

export const UNITS: Unit[] = SECTIONS.flatMap((s, si) => s.units.map((u) => ({ ...u, si }) as Unit));
export const UNIT: Record<string, Unit> = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const ALLWORDS: Word[] = [];
export const WORD: Record<string, Word> = {};
UNITS.forEach((u) =>
  u.words.forEach((w) => {
    const o: Word = { ku: w[0], m: w[1], pic: w[2] ?? null, unit: u.id };
    ALLWORDS.push(o);
    if (!WORD[o.ku]) WORD[o.ku] = o;
  }),
);
export const UNIQUE = Object.keys(WORD).length;

export const NODES: NodeT[] = [];
UNITS.forEach((u, ui) => {
  const chunks: [number, number][] = [];
  for (let i = 0; i < u.words.length; i += 4) chunks.push([i, Math.min(i + 4, u.words.length)]);
  if (chunks.length > 1 && chunks[chunks.length - 1][1] - chunks[chunks.length - 1][0] < 2) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1][1] = last[1];
  }
  chunks.forEach((c, k) => NODES.push({ id: `${u.id}:l${k}`, unit: u.id, ui, type: "learn", range: c, k: k + 1 }));
  NODES.push({ id: `${u.id}:s`, unit: u.id, ui, type: "sent" });
  if (u.story) NODES.push({ id: `${u.id}:st`, unit: u.id, ui, type: "story" });
  NODES.push({ id: `${u.id}:c`, unit: u.id, ui, type: "chest" });
});
export const NODE: Record<string, NodeT> = Object.fromEntries(NODES.map((n) => [n.id, n]));
export const NODE_INDEX: Record<string, number> = Object.fromEntries(NODES.map((n, i) => [n.id, i]));

/** CEFR levels in course order, derived from the content (A1, A2, B1, …). */
export const LEVELS: Level[] = SECTIONS.reduce<Level[]>((a, s) => (a.includes(s.lvl) ? a : [...a, s.lvl]), []);
/** First unit of a level (undefined if the level is not in the content). */
export const levelFirstUnit = (lvl: Level) => UNITS.find((u) => SECTIONS[u.si].lvl === lvl);
