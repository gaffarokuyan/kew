import { getS, replaceState, subscribe, update, type State } from "@/lib/store";

/**
 * Cloud backup with a recovery code (Supabase function "juji-backup"). No account: the learner keeps a
 * 12-character code; the server stores only its hash next to the progress. With the code, a new phone
 * (or the web version) restores everything. Auto-backup runs a little after progress changes.
 */
const URL = process.env.EXPO_PUBLIC_BACKUP_URL || "https://ppntnfpiqsynzenwiiha.supabase.co/functions/v1/juji-backup";
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

export const fmtCode = (c: string) => c.replace(/[^A-Z0-9]/gi, "").toUpperCase().replace(/(.{4})(?=.)/g, "$1-");
const cleanCode = (c: string) => c.replace(/[^A-Z0-9]/gi, "").toUpperCase();

function newCode() {
  const b = new Uint8Array(12);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b, (x) => ABC[x % ABC.length]).join("");
}

async function call(body: Record<string, unknown>): Promise<{ ok?: boolean; at?: number; data?: State; error?: string }> {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(URL, { method: "POST", headers: { "content-type": "application/json", "x-juji-app": "juji-app-1" }, body: JSON.stringify(body), signal: ctl.signal });
    return await r.json().catch(() => ({ error: "bad response" }));
  } catch { return { error: "net" }; } finally { clearTimeout(to); }
}

/** What goes to the cloud: the whole state except server-side caches and the backup block itself. */
function snapshot() {
  const s = { ...getS() } as Partial<State>;
  delete s.lgCache; delete s.backup;
  return s;
}

let busy = false;
/** Save now (creates the code on first use). Returns null on success or an error key. */
export async function backupNow(): Promise<string | null> {
  if (busy) return null; busy = true;
  try {
    const code = getS().backup?.code ?? newCode();
    if (!getS().backup) update((x) => { x.backup = { code, auto: true }; });
    const r = await call({ op: "save", code, data: snapshot() });
    if (r.ok) { update((x) => { if (x.backup) x.backup.at = r.at ?? Date.now(); }); return null; }
    return r.error ?? "error";
  } finally { busy = false; }
}

/** Restore from a code; the current progress on this device is replaced. */
export async function restore(codeIn: string): Promise<string | null> {
  const code = cleanCode(codeIn); if (code.length !== 12) return "bad code";
  const r = await call({ op: "load", code });
  if (!r.data) return r.error ?? "error";
  replaceState({ ...r.data, onboard: true });
  update((x) => { x.backup = { code, auto: true, at: r.at }; });
  return null;
}

export function setAuto(on: boolean) { update((x) => { if (x.backup) x.backup.auto = on; }); if (on) backupNow(); }

/** Auto-backup: two minutes after XP / lessons / words change, at most every few minutes. */
export function startAutoBackup() {
  let t: ReturnType<typeof setTimeout> | null = null; let sig = "";
  const key = () => { const s = getS(); return `${s.xp}|${Object.keys(s.done).length}|${Object.keys(s.words).length}|${s.course}|${s.streak}`; };
  sig = key();
  const off = subscribe(() => {
    const b = getS().backup; if (!b?.auto) return;
    const k = key(); if (k === sig) return; sig = k;
    if (t) clearTimeout(t); t = setTimeout(() => { backupNow(); }, 120_000);
  });
  return () => { off(); if (t) clearTimeout(t); };
}
