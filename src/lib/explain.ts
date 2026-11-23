import { courseId, UNITS, WORD } from "./course";
import { M } from "./i18n";
import { norm } from "./exercises";

/**
 * "Why was this wrong?" — short, rule-based explanations shown under a wrong answer.
 * No network: built from the learner's answer, the correct answer and the course's own tips.
 */
export type Why = { lines: string[]; tip?: { ku: string; m: string } };

// Kurmancî letters learners mix up, with a one-line hint each ("tr|en|de")
const LETTER: Record<string, string> = {
  "e|ê": "«e» kısa ve açık (Türkçe e), «ê» uzun ve kapalı (Türkçe «ey»e yakın).|«e» is short and open, «ê» is long and closed (like «ay» in «say»).|«e» ist kurz und offen, «ê» lang und geschlossen (wie in «See»).",
  "i|î": "«i» kısa ve belirsiz (Türkçe ı gibi), «î» uzun (Türkçe i gibi).|«i» is short and unclear (like the «i» in «bit»), «î» is long (like «ee»).|«i» ist kurz und dumpf, «î» ist lang (wie «ie»).",
  "u|û": "«u» kısa, «û» uzun (Türkçe «u»yu uzatır gibi).|«u» is short, «û» is long (like «oo»).|«u» ist kurz, «û» ist lang (wie «uh»).",
  "ê|î": "«ê» Türkçe «ey»e, «î» Türkçe «i»ye yakın.|«ê» sounds like «ay», «î» like «ee».|«ê» klingt wie «ee» in «See», «î» wie «ie».",
  "c|ç": "«c» Türkçe c, «ç» Türkçe ç.|«c» is like «j» in «jam», «ç» like «ch» in «chair».|«c» wie «dsch», «ç» wie «tsch».",
  "s|ş": "«s» Türkçe s, «ş» Türkçe ş.|«s» is «s», «ş» is «sh».|«s» ist «s», «ş» ist «sch».",
  "h|x": "«h» yumuşak, «x» gırtlaktan sert (Almanca «ch» gibi).|«h» is soft, «x» is a rough throat sound (like German «Bach»).|«h» ist weich, «x» wie «ch» in «Bach».",
  "k|q": "«q» «k»dan daha geriden, gırtlağa yakın söylenir.|«q» is said further back in the throat than «k».|«q» wird weiter hinten im Rachen gesprochen als «k».",
  "w|v": "«w» İngilizce w gibi (dudaklar yuvarlak), «v» Türkçe v.|«w» is like English «w», «v» is like «v».|«w» wie englisches «w», «v» wie deutsches «w».",
};
const letterKey = (a: string, b: string) => [a, b].sort().join("|");

/** first position where the two words differ by one swapped letter → hint for that pair */
function letterHint(given: string, want: string): string | null {
  const a = norm(given), b = norm(want);
  if (a.length !== b.length) return null;
  let diff = -1;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { if (diff >= 0) return null; diff = i; }
  if (diff < 0) return null;
  const h = LETTER[letterKey(a[diff], b[diff])];
  return h ? M(h) : null;
}

/** word-level comparison for sentence answers: what was missing, extra or out of order */
function sentenceHint(given: string, want: string): string[] {
  const g = norm(given).split(" ").filter(Boolean), w = norm(want).split(" ").filter(Boolean);
  const out: string[] = [];
  const miss = w.filter((x) => !g.includes(x)), extra = g.filter((x) => !w.includes(x));
  if (miss.length) out.push(M("Eksik kelime: |Missing: |Fehlt: ") + miss.map((x) => `«${x}»`).join(", "));
  if (extra.length) out.push(M("Fazla kelime: |Not needed: |Überflüssig: ") + extra.map((x) => `«${x}»`).join(", "));
  if (!miss.length && !extra.length && g.join(" ") !== w.join(" ")) {
    out.push(M(courseId() === "eng"
      ? "Kelimeler doğru, sıra yanlış. İngilizcede sıra özne + fiil + nesnedir (I eat bread); fiil sona gitmez.|Right words, wrong order: subject + verb + object.|Richtige Wörter, falsche Reihenfolge: Subjekt + Verb + Objekt."
      : courseId() === "ckb"
      ? "Kelimeler doğru, sıra yanlış. Soranîde fiil genellikle cümlenin sonunda gelir.|Right words, wrong order. In Soranî the verb usually comes last.|Richtige Wörter, falsche Reihenfolge. Im Soranî steht das Verb meist am Ende."
      : "Kelimeler doğru, sıra yanlış. Kürtçede fiil genellikle cümlenin sonunda gelir (Ez nan dixwim).|Right words, wrong order. In Kurdish the verb usually comes last (Ez nan dixwim).|Richtige Wörter, falsche Reihenfolge. Im Kurdischen steht das Verb meist am Ende (Ez nan dixwim)."));
  }
  return out;
}

/** For a correct sentence: a tip from that sentence's own unit whose example shares a word with it, or nothing. */
export function unitTipFor(sentence: string): Why["tip"] {
  const u = UNITS.find((x) => x.sents?.some((r) => r[0] === sentence)); if (!u?.tips?.length) return undefined;
  const toks = new Set(norm(sentence).split(" ").filter((x) => x.length > 1));
  for (const [ku, m] of u.tips) {
    const tt = norm(ku).split(/[ ·/+…→=]+/).filter((x) => x.length > 1);
    if (tt.filter((x) => toks.has(x)).length >= Math.min(2, tt.length)) return { ku, m: M(m) };
  }
  return undefined;
}

/** a tip from the course whose example shares a word with the answer */
export function findTip(text: string): Why["tip"] {
  const toks = new Set(norm(text).split(" ").filter((x) => x.length > 1));
  const unit = WORD[text]?.unit;
  const ordered = unit ? [...UNITS.filter((u) => u.id === unit), ...UNITS] : UNITS;
  for (const u of ordered) for (const [ku, m] of u.tips ?? []) {
    const tt = norm(ku).split(/[ ·/+…→=]+/).filter((x) => x.length > 1);
    if (tt.some((x) => toks.has(x))) return { ku, m: M(m) };
  }
  return undefined;
}

export function explain(given: string | null | undefined, want: string, sentence: boolean, ku?: string): Why | null {
  if (!given || !want) return null;
  const lines: string[] = [];
  if (sentence) lines.push(...sentenceHint(given, want));
  else {
    const h = letterHint(given, want);
    if (h) lines.push(h);
    else if (norm(given).length && norm(want).startsWith(norm(given).slice(0, 2)) && Math.abs(given.length - want.length) <= 2)
      lines.push(M("Çok yakındın, harflere dikkat et.|Very close, check the letters.|Sehr knapp, achte auf die Buchstaben."));
  }
  const tip = findTip(ku ?? want);
  return lines.length || tip ? { lines, tip } : null;
}
