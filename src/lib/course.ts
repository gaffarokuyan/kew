import data from "@/content/course.json";
import zza from "@/content/course_zza.json";
import ckb from "@/content/course_ckb.json";
import eng from "@/content/course_eng.json";
import deu from "@/content/course_deu.json";

export type Meaning = string; // "tr|en|de"
export type WordRow = [string, Meaning, string?];
export type SentRow = [string, Meaning];
export type StoryLine = [string, string, Meaning, { q: Meaning; options: string[] }?];
export type Unit = {
  id: string; ku: string; col: string; name: Meaning; words: WordRow[]; sents: SentRow[];
  tips?: [string, Meaning][]; note?: Meaning; story?: { title: string; lines: StoryLine[] }; si: number;
};
export type Level = "A1" | "A2" | "B1" | "B2";
export type Section = { lvl: Level; name: Meaning; sub: Meaning; units: Omit<Unit, "si">[] };
export type Char = { c: string; hair: string; g: "m" | "f"; scarf?: string; moust?: number };
export type NodeT = { id: string; unit: string; ui: number; type: "learn" | "sent" | "story" | "chest"; range?: [number, number]; k?: number };
export type Word = { ku: string; m: Meaning; pic: string | null; unit: string };

export type CourseId = "kmr" | "zza" | "ckb" | "eng" | "deu";
/** How Soranî is written: Arabic-based Kurdish alphabet, Latin, or both (Arabic large, Latin underneath). */
export type Script = "ar" | "lat" | "both";
const DATA: Record<CourseId, typeof data> = { kmr: data, zza: zza as unknown as typeof data, ckb: ckb as unknown as typeof data, eng: eng as unknown as typeof data, deu: deu as unknown as typeof data };
/** Courses offered; `beta` courses are new and still being checked by native speakers. */
const ALL_COURSES: { id: CourseId; name: string; sub: Meaning; beta?: boolean; base?: string[] }[] = [
  { id: "kmr", name: "Kurmancî", sub: "Kürtçe (Kurmancî)|Kurdish (Kurmanji)|Kurdisch (Kurmancî)" },
  { id: "zza", name: "Kirmanckî", sub: "Zazaca (Kirmanckî)|Zazaki (Kirmanckî)|Zazaki (Kirmanckî)", beta: true },
  { id: "ckb", name: "Soranî", sub: "Kürtçe (Soranî)|Kurdish (Sorani)|Kurdisch (Soranî)", beta: true },
  // English is taught from Turkish only, so it is offered only with a Turkish interface.
  { id: "eng", name: "English", sub: "İngilizce|English|Englisch", beta: true, base: ["tr"] },
  { id: "deu", name: "Deutsch", sub: "Almanca|German|Deutsch", beta: true, base: ["tr"] },
];
/** Foreign-language courses taught from Turkish: read by the device voice, no Kurdish-only extras. */
export const FOREIGN: Partial<Record<CourseId, { tts: string; hi: string }>> = { eng: { tts: "en-US", hi: "Hello, how are you?" }, deu: { tts: "de-DE", hi: "Hallo, wie geht es dir?" } };
export const isForeign = (id: CourseId = courseId()) => !!FOREIGN[id];

/** Courses that have content. */
export const COURSES = ALL_COURSES.filter((c) => (DATA[c.id]?.SECTIONS?.length ?? 0) > 0);
/** Courses that can be taught in the given interface language. */
export const coursesFor = (lang: string | null) => COURSES.filter((c) => !c.base || c.base.includes(lang || "tr"));
let COURSE: CourseId = "kmr"; let SCRIPT: Script = "both";
export const scriptOf = () => (COURSE === "ckb" ? SCRIPT : null);
/** Soranî: Arabic-script text → Latin, and Latin → Arabic (for the active course only). */
export const LAT: Record<string, string> = {};
export const ARB: Record<string, string> = {};
export const courseId = () => COURSE;

/* All course tables are mutated in place by loadCourse(), so every importer always sees the active course. */
export const SECTIONS: Section[] = [];
export const CHARS: Record<string, Char> = {};
export const SAYINGS: SentRow[] = [];
export const UNITS: Unit[] = [];
export const UNIT: Record<string, Unit> = {};
export const ALLWORDS: Word[] = [];
export const WORD: Record<string, Word> = {};
export const NODES: NodeT[] = [];
export const NODE: Record<string, NodeT> = {};
export const NODE_INDEX: Record<string, number> = {};
/** CEFR levels in course order, derived from the content (A1, A2, B1, …). */
export const LEVELS: Level[] = [];
export const META = { unique: 0, rev: 0 };
const clear = (o: Record<string, unknown>) => Object.keys(o).forEach((k) => delete o[k]);

/** Deep copy of course data with every Soranî string swapped for its Latin form. */
function toLatin<T>(x: T, m: Record<string, string>): T {
  if (typeof x === "string") return (m[x] ?? x) as T;
  if (Array.isArray(x)) return x.map((y) => toLatin(y, m)) as T;
  if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, toLatin(v, m)])) as T;
  return x;
}
export function loadCourse(id: CourseId, script: Script = "both") {
  let d = DATA[id] ?? DATA.kmr; COURSE = DATA[id] ? id : "kmr"; SCRIPT = script;
  clear(LAT); clear(ARB);
  const lat = (d as unknown as { LAT?: Record<string, string> }).LAT;
  if (COURSE === "ckb" && lat) {
    Object.assign(LAT, lat); Object.entries(lat).forEach(([a, l]) => { ARB[l] = a; });
    if (script === "lat") d = toLatin(d, lat);
  }
  SECTIONS.splice(0, SECTIONS.length, ...(d.SECTIONS as unknown as Section[]));
  clear(CHARS); Object.assign(CHARS, DATA.kmr.CHARS, d.CHARS || {});
  SAYINGS.splice(0, SAYINGS.length, ...((d.SAYINGS as unknown as SentRow[]) || []));
  UNITS.splice(0, UNITS.length, ...SECTIONS.flatMap((s, si) => s.units.map((u) => ({ ...u, si }) as Unit)));
  clear(UNIT); UNITS.forEach((u) => { UNIT[u.id] = u; });
  ALLWORDS.length = 0; clear(WORD);
  UNITS.forEach((u) => u.words.forEach((w) => { const o: Word = { ku: w[0], m: w[1], pic: w[2] ?? null, unit: u.id }; ALLWORDS.push(o); if (!WORD[o.ku]) WORD[o.ku] = o; }));
  META.unique = Object.keys(WORD).length;
  NODES.length = 0;
  UNITS.forEach((u, ui) => {
    const chunks: [number, number][] = [];
    for (let i = 0; i < u.words.length; i += 4) chunks.push([i, Math.min(i + 4, u.words.length)]);
    if (chunks.length > 1 && chunks[chunks.length - 1][1] - chunks[chunks.length - 1][0] < 2) { const last = chunks.pop()!; chunks[chunks.length - 1][1] = last[1]; }
    chunks.forEach((c, k) => NODES.push({ id: `${u.id}:l${k}`, unit: u.id, ui, type: "learn", range: c, k: k + 1 }));
    NODES.push({ id: `${u.id}:s`, unit: u.id, ui, type: "sent" });
    if (u.story) NODES.push({ id: `${u.id}:st`, unit: u.id, ui, type: "story" });
    NODES.push({ id: `${u.id}:c`, unit: u.id, ui, type: "chest" });
  });
  clear(NODE); clear(NODE_INDEX); NODES.forEach((n, i) => { NODE[n.id] = n; NODE_INDEX[n.id] = i; });
  LEVELS.splice(0, LEVELS.length, ...SECTIONS.reduce<Level[]>((a, s) => (a.includes(s.lvl) ? a : [...a, s.lvl]), []));
  META.rev++;
}
loadCourse("kmr");
/** Number of distinct words in the active course. */
export const uniqueWords = () => META.unique;
/** First unit of a level (undefined if the level is not in the content). */
export const levelFirstUnit = (lvl: Level) => UNITS.find((u) => SECTIONS[u.si].lvl === lvl);
