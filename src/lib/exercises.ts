import { ALLWORDS, NODE, UNIT, UNITS, WORD, type NodeT, type SentRow, type Unit, type Word } from "./course";
import { M, locale } from "./i18n";

export type W = { ku: string; m: string; pic: string | null; unit?: string };
export type Ex =
  | { t: "new"; w: W }
  | { t: "mc" | "mcr" | "listen"; w: W; opts: string[] }
  | { t: "pic"; w: W; cards: W[] }
  | { t: "match"; pairs: W[] }
  | { t: "build"; prompt: string; ans: string; toks: string[]; say: string; rev?: boolean }
  | { t: "fill"; s: SentRow; j: number; opts: string[]; ans: string }
  | { t: "type"; w: W };

export const shuffle = <T,>(a: T[]): T[] => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);
export const norm = (s: string) =>
  String(s).toLocaleLowerCase(locale() === "tr" ? "tr" : "en").replace(/[.,!?¿;:'’"«»…-]/g, " ").replace(/\s+/g, " ").trim();
export function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const toW = (w: [string, string, string?]): W => ({ ku: w[0], m: w[1], pic: w[2] ?? null });
export const mean = (w: { m: string }) => M(w.m);

function distract(correct: W, field: "ku" | "m", pool: W[], n: number) {
  const val = (w: W) => (field === "ku" ? w.ku : mean(w));
  const seen = new Set([norm(val(correct))]); const out: string[] = [];
  for (const w of shuffle(pool).concat(shuffle(ALLWORDS as W[]))) {
    const v = val(w); if (!seen.has(norm(v))) { seen.add(norm(v)); out.push(v); }
    if (out.length >= n) break;
  }
  return out;
}
const mcEx = (w: W, pool: W[]): Ex => ({ t: "mc", w, opts: shuffle([w.ku, ...distract(w, "ku", pool, 2)]) });
const mcrEx = (w: W, pool: W[]): Ex => ({ t: "mcr", w, opts: shuffle([mean(w), ...distract(w, "m", pool, 2)]) });
const lsEx = (w: W, pool: W[]): Ex => ({ t: "listen", w, opts: shuffle([w.ku, ...distract(w, "ku", pool, 2)]) });

export function buildEx(s: SentRow, u: Unit, rev = false): Ex {
  const [ku, m] = s;
  if (!rev) {
    const toks = ku.split(" ");
    const extra = pick(u.words.map((w) => w[0].split(" ")[0].toLowerCase()).filter((x) => !toks.map(norm).includes(norm(x))), 2);
    return { t: "build", prompt: M(m), ans: ku, toks: shuffle([...toks, ...extra]), say: ku };
  }
  const base = M(m), toks = base.split(" ");
  const others = UNITS.flatMap((x) => x.sents.map((s) => M(s[1]))).join(" ").split(" ").filter((x) => x && !toks.map(norm).includes(norm(x)));
  return { t: "build", prompt: ku, ans: base, toks: shuffle([...toks, ...pick([...new Set(others)], 2)]), say: ku, rev: true };
}

export function genLearn(n: NodeT, voice: boolean, known: Record<string, unknown>): Ex[] {
  const u = UNIT[n.unit], [a, b] = n.range!, pool = u.words.map(toW), fresh = pool.slice(a, b), prev = pool.slice(0, a);
  const head: Ex[] = [], ex: Ex[] = [];
  fresh.forEach((w, i) => { if (!known[w.ku]) head.push({ t: "new", w }); head.push(i % 2 ? mcrEx(w, pool) : mcEx(w, pool)); });
  const picd = fresh.concat(prev).filter((w) => w.pic);
  if (picd.length) { const w = pick(picd, 1)[0], others = pick(pool.filter((x) => x.pic && x.ku !== w.ku), 3); if (others.length >= 2) ex.push({ t: "pic", w, cards: shuffle([w, ...others]) }); }
  const mixd = shuffle(fresh.concat(pick(prev, 2)));
  if (voice) mixd.slice(0, 2).forEach((w) => ex.push(lsEx(w, pool)));
  mixd.slice(2, 4).forEach((w) => ex.push(mcrEx(w, pool)));
  const mp = fresh.concat(prev); if (mp.length >= 4) ex.push({ t: "match", pairs: pick(mp, Math.min(5, mp.length)) });
  if (a > 0 || u.words.length <= 5) ex.push(buildEx(pick(u.sents, 1)[0], u));
  if (voice && fresh.length) ex.push({ t: "type", w: pick(fresh, 1)[0] });
  return head.concat(shuffle(ex));
}
export function genSent(n: NodeT, voice: boolean): Ex[] {
  const u = UNIT[n.unit], pool = u.words.map(toW), ex: Ex[] = [];
  shuffle(u.sents).forEach((s, i) => {
    ex.push(buildEx(s, u, i % 2 === 1));
    const cand = s[0].split(" ").map((tk, j) => ({ tk, j, c: tk.replace(/[.,!?]/g, "") })).filter((x) => WORD[x.c] || WORD[x.c.toLowerCase()]);
    if (cand.length && i < 3) {
      const c = pick(cand, 1)[0], w = (WORD[c.c] || WORD[c.c.toLowerCase()]) as W;
      ex.push({ t: "fill", s, j: c.j, opts: shuffle([c.c, ...distract(w, "ku", pool, 2)]), ans: c.c });
    }
  });
  if (voice) { const s = pick(u.sents, 1)[0]; ex.push({ t: "type", w: { ku: s[0], m: s[1], pic: null } }); }
  ex.push({ t: "match", pairs: pick(pool, Math.min(5, pool.length)) });
  return shuffle(ex).slice(0, 12);
}
export function genReview(keys: string[], voice: boolean, listenOnly = false, n = 99): Ex[] {
  const ex: Ex[] = []; const ws = keys.map((k) => WORD[k]).filter(Boolean) as Word[];
  ws.forEach((w, i) => {
    const pool = ALLWORDS.filter((x) => x.unit === w.unit) as W[];
    if (listenOnly) { ex.push(i % 2 && voice ? { t: "type", w } : lsEx(w, pool)); return; }
    const r = i % 4, pics = pool.filter((x) => x.pic && x.ku !== w.ku);
    ex.push(r === 0 ? mcEx(w, pool) : r === 2 && voice ? lsEx(w, pool) : r === 3 && w.pic && pics.length >= 2 ? { t: "pic", w, cards: shuffle([w, ...pick(pics, 3)]) } : mcrEx(w, pool));
  });
  if (!listenOnly && ws.length >= 4) ex.push({ t: "match", pairs: pick(ws, Math.min(5, ws.length)) });
  return shuffle(ex).slice(0, n);
}
export function genJump(uid: string, voice: boolean): Ex[] {
  const ui = UNITS.findIndex((u) => u.id === uid);
  const keys = [...new Set(UNITS.slice(0, ui).flatMap((x) => x.words.map((w) => w[0])))];
  const exs = genReview(pick(keys, 10), voice, false, 10);
  pick(UNITS.slice(Math.max(0, ui - 3), ui), 2).forEach((x) => exs.push(buildEx(pick(x.sents, 1)[0], x, Math.random() < 0.5)));
  return shuffle(exs);
}
export const nodeOf = (id: string) => NODE[id];
/** Every Kurmancî string an exercise might speak — used to warm the audio player. */
export const exTexts = (e: Ex): string[] =>
  "w" in e ? [e.w.ku] : e.t === "match" ? e.pairs.map((w) => w.ku) : e.t === "build" ? [e.say] : e.t === "fill" ? [e.s[0]] : [];
