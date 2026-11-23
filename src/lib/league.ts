import { day, dayAdd, getS, subscribe, update } from "@/lib/store";

/**
 * Weekly league + friends (Supabase edge function "juji-league").
 * Opt-in: nothing is sent until the learner picks a nickname. The device keeps a random secret;
 * the server stores only its hash, the nickname, weekly XP, streak and course.
 */
export const LEAGUE_URL = process.env.EXPO_PUBLIC_LEAGUE_URL || "https://ppntnfpiqsynzenwiiha.supabase.co/functions/v1/juji-league";
const APP_TOKEN = "juji-app-1";

export type LeagueRow = { nick: string; xp: number; streak: number; me: boolean };
export type Friend = { code: string; nick: string; xp: number; streak: number; course: string };
export type LeagueState = { nick: string; code: string; tier: number; result: number; week: string; ends: number; group: LeagueRow[]; friends: Friend[]; at?: number };

/** Ten tiers, from seed to star — named after things of the Kurdish landscape. */
export const TIERS: { ku: string; m: string; c: string }[] = [
  { ku: "Tov", m: "Tohum|Seed|Samen", c: "#9C7A54" },
  { ku: "Şitil", m: "Fide|Sapling|Setzling", c: "#6E9A4A" },
  { ku: "Kulîlk", m: "Çiçek|Flower|Blume", c: "#D9739B" },
  { ku: "Gul", m: "Gül|Rose|Rose", c: "#C23B4E" },
  { ku: "Hinar", m: "Nar|Pomegranate|Granatapfel", c: "#A8243A" },
  { ku: "Berû", m: "Meşe|Oak|Eiche", c: "#5C7A2E" },
  { ku: "Zinar", m: "Kaya|Rock|Fels", c: "#6F7680" },
  { ku: "Çiya", m: "Dağ|Mountain|Berg", c: "#3F6E8C" },
  { ku: "Ezman", m: "Gökyüzü|Sky|Himmel", c: "#3A7BD5" },
  { ku: "Stêrk", m: "Yıldız|Star|Stern", c: "#D9A21B" },
];
export const PROMOTE = (n: number) => Math.min(7, Math.ceil(n / 3));
export const DEMOTE = (n: number, tier: number) => (tier > 0 && n >= 10 ? 5 : 0);

/** Monday of this week (Türkiye time, like the server), as YYYY-MM-DD. */
function monday() {
  const d = new Date(Date.now() + 3 * 3600_000), back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10);
}
/** XP earned since Monday (from the local daily log). */
export function weekXP() {
  const s = getS(), m = monday(); let sum = 0;
  for (let d = day(); d >= m; d = dayAdd(d, -1)) sum += s.xpLog[d] || 0;
  return sum;
}

function newSecret() {
  const b = new Uint8Array(24);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("") + Date.now().toString(36);
}

async function call(body: Record<string, unknown>): Promise<LeagueState | { ok: true } | { error: string }> {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(LEAGUE_URL, { method: "POST", headers: { "content-type": "application/json", "x-juji-app": APP_TOKEN }, body: JSON.stringify(body), signal: ctl.signal });
    const j = await r.json().catch(() => ({ error: "bad response" }));
    return r.ok ? j : { error: j.error || String(r.status) };
  } catch { return { error: "net" }; } finally { clearTimeout(to); }
}
const isState = (x: unknown): x is LeagueState => !!x && typeof x === "object" && "group" in x;
const save = (st: LeagueState) => update((s) => { s.lgCache = { ...st, at: Date.now() }; });
const payload = () => { const s = getS(); return { secret: s.lg!.secret, xp: weekXP(), streak: s.streak, course: s.course }; };

let busy = false, last = 0;

export async function joinLeague(nick: string): Promise<string | null> {
  const s = getS(); const secret = s.lg?.secret ?? newSecret();
  busy = true; // keep background sync from racing the first join
  try {
    update((x) => { x.lg = { secret, nick }; });
    const r = await call({ op: "join", nick, ...payload() });
    if (isState(r)) { save(r); last = Date.now(); return null; }
    if (!getS().lgCache) update((x) => { delete x.lg; }); // first join failed: stay opted out
    return "error" in r ? r.error : "error";
  } finally { busy = false; }
}

/** Push weekly XP and pull the group. Throttled; silently does nothing when not joined or offline. */
export async function syncLeague(force = false): Promise<string | null> {
  if (!getS().lg || busy) return null;
  if (!force && Date.now() - last < 20_000) return null;
  busy = true; last = Date.now();
  try {
    const r = await call({ op: "sync", ...payload() });
    if (isState(r)) { save(r); return null; }
    if ("error" in r && r.error === "not joined") update((x) => { delete x.lg; delete x.lgCache; });
    return "error" in r ? r.error : null;
  } finally { busy = false; }
}

export async function addFriend(code: string): Promise<string | null> {
  if (!getS().lg) return "not joined";
  const r = await call({ op: "friend", secret: getS().lg!.secret, code });
  if (isState(r)) { save(r); return null; }
  return "error" in r ? r.error : "error";
}
export async function removeFriend(code: string) {
  if (!getS().lg) return;
  const r = await call({ op: "unfriend", secret: getS().lg!.secret, code });
  if (isState(r)) save(r);
}
/** Deletes the learner from the server (nickname, XP, friends) and forgets the secret. */
export async function leaveLeague(): Promise<boolean> {
  if (!getS().lg) return true;
  const r = await call({ op: "leave", secret: getS().lg!.secret });
  if ("ok" in r || ("error" in r && r.error === "not joined")) { update((x) => { delete x.lg; delete x.lgCache; }); return true; }
  return false;
}

/** Background sync: a few seconds after XP changes, and when the app comes back. */
export function startLeagueSync() {
  let xp = getS().xp, t: ReturnType<typeof setTimeout> | null = null;
  const off = subscribe(() => {
    const now = getS().xp; if (now === xp) return; xp = now;
    if (t) clearTimeout(t); t = setTimeout(() => syncLeague(true), 4000);
  });
  syncLeague(true);
  return () => { off(); if (t) clearTimeout(t); };
}

/** My rank in the group (1-based), or 0. */
export const myRank = (st: LeagueState) => st.group.findIndex((r) => r.me) + 1;
