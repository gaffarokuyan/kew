import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { ARB, LAT, loadCourse, NODES, NODE_INDEX, WORD, type CourseId, type Script } from "./course";

export const MAXH = 5;
export const HEART_MS = 30 * 60 * 1000;
const KEY = "kew:v3";

export const day = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4);
  return z.toISOString().slice(0, 10);
};
export const dayAdd = (s: string, n: number) => {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + n);
  return day(d);
};

export type Lang = "tr" | "en" | "de";
/** Per-course progress, stashed while another course is active. */
export type Prog = { done: State["done"]; words: State["words"]; mistakes: string[]; msents: string[]; level: number };
export type State = {
  v: 3; onboard: boolean; lang: Lang | null; level: number; goal: number; xp: number; gems: number;
  hearts: number; heartAt: number; streak: number; last: string | null; freeze: number; best: number;
  done: Record<string, boolean>; words: Record<string, { s: number; t: number; seen: number }>; mistakes: string[];
  xpLog: Record<string, number>; daily: { date: string | null; xp: number; lessons: number; bestCombo: number; claimed: string[] };
  stats: { perfect: number; stories: number; lessons: number; jumps: number };
  set: { sfx: boolean; voice: boolean; rate: number; speak: boolean }; speakPause: number;
  course: CourseId; saved: Partial<Record<CourseId, Prog>>; msents: string[];
  /** Soranî alphabet the learner picked; null until asked. */
  ckbScript: Script | null;
  /** Podcast episodes finished: id -> time. Ids carry the course, so this is shared across courses. */
  pods: Record<string, number>;
  /** Podcast level the learner last picked (A1, A2, ...), per course. */
  podLvl: Record<string, string>;
};
const DEF = (): State => ({
  v: 3, onboard: false, lang: null, level: 0, goal: 20, xp: 0, gems: 120, hearts: MAXH, heartAt: Date.now(), streak: 0, last: null,
  freeze: 0, best: 0, done: {}, words: {}, mistakes: [], xpLog: {}, daily: { date: null, xp: 0, lessons: 0, bestCombo: 0, claimed: [] },
  stats: { perfect: 0, stories: 0, lessons: 0, jumps: 0 }, set: { sfx: true, voice: true, rate: 1, speak: true }, speakPause: 0, course: "kmr", saved: {}, msents: [], ckbScript: null, pods: {}, podLvl: {},
});

let S: State = DEF();
let version = 0;
const listeners = new Set<() => void>();
let saveT: ReturnType<typeof setTimeout> | null = null;

export const getS = () => S;
/** Mutate state, then notify subscribers and persist (debounced). */
export function update(fn: (s: State) => void) {
  fn(S);
  S = { ...S };
  version++;
  listeners.forEach((l) => l());
  if (saveT) clearTimeout(saveT);
  saveT = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(S)).catch(() => {}), 250);
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => sel(S),
  );
}
export async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (s && s.v === 3) {
      const d = DEF();
      S = { ...d, ...s, set: { ...d.set, ...(s.set || {}) }, daily: { ...d.daily, ...(s.daily || {}) }, stats: { ...d.stats, ...(s.stats || {}) } };
    }
  } catch {}
  loadCourse(S.course || "kmr", S.ckbScript || "both");
  return tick();
}
/** Change the Soranî alphabet. Progress is keyed by the shown text, so re-key it between Arabic and Latin. */
export function setCkbScript(m: Script) {
  update((s) => {
    const was = s.ckbScript || "both"; s.ckbScript = m;
    if (s.course !== "ckb") return;
    const toLat = m === "lat" && was !== "lat", toAr = m !== "lat" && was === "lat";
    if (toLat || toAr) {
      const f = (k: string) => (toLat ? LAT[k] : ARB[k]) ?? k;
      s.words = Object.fromEntries(Object.entries(s.words).map(([k, v]) => [f(k), v]));
      s.mistakes = s.mistakes.map(f); s.msents = s.msents.map(f);
    }
    loadCourse("ckb", m);
  });
}
/** Switch the course being learnt: stash this course's progress and restore the other one's. */
export function switchCourse(id: CourseId) {
  if (S.course === id) return;
  update((s) => {
    s.saved[s.course] = { done: s.done, words: s.words, mistakes: s.mistakes, msents: s.msents, level: s.level };
    const p = s.saved[id];
    s.done = p?.done ?? {}; s.words = p?.words ?? {}; s.mistakes = p?.mistakes ?? []; s.msents = p?.msents ?? []; s.level = p?.level ?? 0;
    delete s.saved[id]; s.course = id;
    loadCourse(id, s.ckbScript || "both");
  });
}
export async function resetAll() {
  const lang = S.lang;
  update((s) => Object.assign(s, DEF(), { lang }));
}

/** Refill hearts over time, roll the day, spend streak freezes. Returns streak saved by a freeze, if any. */
export function tick(): number | null {
  let frozen: number | null = null;
  update((s) => {
    if (s.hearts < MAXH) {
      const n = Math.floor((Date.now() - s.heartAt) / HEART_MS);
      if (n > 0) { s.hearts = Math.min(MAXH, s.hearts + n); s.heartAt += n * HEART_MS; }
    } else s.heartAt = Date.now();
    const td = day();
    if (s.daily.date !== td) s.daily = { date: td, xp: 0, lessons: 0, bestCombo: 0, claimed: [] };
    if (s.last && s.last < dayAdd(td, -1)) {
      const gap = Math.round((+new Date(td) - +new Date(s.last)) / 864e5) - 1;
      if (gap <= s.freeze && s.streak > 0) { s.freeze -= gap; s.last = dayAdd(td, -1); frozen = s.streak; } else s.streak = 0;
    }
  });
  return frozen;
}
/** Adds XP; returns true when this extended the streak (first XP of the day). */
export function addXP(n: number): boolean {
  let up = false;
  update((s) => {
    const td = day();
    s.xp += n; s.daily.xp += n; s.xpLog[td] = (s.xpLog[td] || 0) + n;
    if (s.last !== td) { s.streak = s.last === dayAdd(td, -1) ? s.streak + 1 : 1; s.last = td; s.best = Math.max(s.best, s.streak); up = true; }
  });
  return up;
}
export const isDone = (id: string, s = S) => !!s.done[id];
export const firstOpen = (s = S) => NODES.find((n) => !s.done[n.id]);
export const unlocked = (id: string, s = S) => { const i = NODE_INDEX[id]; return i === 0 || !!s.done[NODES[i - 1].id]; };
export function wordStrength(ku: string, s = S) {
  const w = s.words[ku]; if (!w) return 0;
  const age = (Date.now() - w.t) / 864e5;
  return Math.max(0, Math.min(4, w.s - Math.floor(age / 4)));
}
/** Review intervals per strength level (spaced repetition): 0 → now, 1 → 1 day, 2 → 3 days, 3 → 7 days, 4 → 16 days. */
const IV = [0, 1, 3, 7, 16].map((d) => d * 864e5);
/** How overdue a word is: ≥ 1 means it should be reviewed now; higher = more urgent. */
export function dueScore(ku: string, s = S) {
  const w = s.words[ku]; if (!w) return 0;
  const iv = IV[Math.max(0, Math.min(4, w.s))] || 4 * 36e5;
  return (Date.now() - w.t) / iv;
}
export function markWord(ku: string, ok: boolean) {
  if (!WORD[ku]) return;
  const w = S.words[ku] || { s: 0, t: Date.now(), seen: 0 };
  S.words[ku] = { seen: w.seen + 1, s: ok ? Math.min(4, w.s + 1) : Math.max(0, w.s - 1), t: Date.now() };
}
/** Remember a sentence the learner got wrong, for the «my mistakes» mini lesson. */
export function markSent(ku: string, ok: boolean) {
  const i = S.msents.indexOf(ku);
  if (!ok && i < 0) { S.msents.push(ku); if (S.msents.length > 30) S.msents.shift(); }
  if (ok && i >= 0) S.msents.splice(i, 1);
}
export const learned = (s = S) => Object.keys(s.words).filter((k) => WORD[k]);
export const getVersion = () => version;
/** Subscribe a component to every state change and return the current state. */
export function useS(): State {
  useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => version);
  return S;
}
