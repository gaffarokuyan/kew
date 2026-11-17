import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import bundled from "@/content/podcasts.json";
import type { CourseId, Level, Meaning } from "./course";

/**
 * Juji podcasts. Course-agnostic: every episode names its course (kmr, ckb, zza, and later any other language),
 * so adding a language means adding episodes, not code. Text fields in the learner's base language use the
 * "tr|en|de" Meaning format; `t` is always the target language.
 *
 * Episodes ship inside the app and can also be updated without a release from a remote manifest
 * (same shape, higher `version` wins). Audio is optional: `audio` is a URL to one file for the whole episode,
 * and `at` gives each line's start second so the transcript can follow along.
 */
export type PodLine = { s: string; t: string; m: Meaning; lat?: string; at?: number };
export type Episode = {
  id: string; course: CourseId; lvl: Level; n: number; title: string; titleLat?: string; name: Meaning; sub: Meaning;
  audio: string | null; dur?: number; lines: PodLine[]; words: [string, Meaning, string?][];
  quiz: { q: Meaning; o: Meaning[]; a: number }[];
};
type Manifest = { version: number; episodes: Episode[] };

export const REMOTE = "https://gaffarokuyan.github.io/kew/podcasts.json";
const KEY = "kew:pods";

let M: Manifest = bundled as unknown as Manifest;
let ver = 0;
const subs = new Set<() => void>();
const set = (m: Manifest) => { if (m?.episodes?.length && m.version >= M.version) { M = m; ver++; subs.forEach((f) => f()); } };

let loaded = false;
/** Use the cached manifest at once, then look for a newer one online. Safe to call many times. */
export async function loadPods() {
  if (loaded) return; loaded = true;
  try { const c = await AsyncStorage.getItem(KEY); if (c) set(JSON.parse(c)); } catch {}
  try {
    const r = await fetch(REMOTE, { headers: { "Cache-Control": "no-cache" } });
    if (r.ok) { const m = (await r.json()) as Manifest; if (m.version > M.version) { set(m); AsyncStorage.setItem(KEY, JSON.stringify(m)).catch(() => {}); } }
  } catch {}
}

export const usePodsVersion = () => useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => ver);
export const episodesFor = (c: CourseId) => M.episodes.filter((e) => e.course === c).sort((a, b) => a.lvl.localeCompare(b.lvl) || a.n - b.n);
export const episode = (id: string) => M.episodes.find((e) => e.id === id);
/** Line being spoken at second `sec` (needs `at` timings). */
export const lineAt = (e: Episode, sec: number) => { let k = -1; e.lines.forEach((l, i) => { if (l.at != null && l.at <= sec) k = i; }); return k; };
/** Episode title in the script the learner chose (Soranî has Arabic and Latin). */
export const titleOf = (e: Episode, sc: string | null) => (sc === "lat" && e.titleLat ? e.titleLat : e.title);
export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
