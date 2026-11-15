import { AudioQuality, IOSOutputFormat, requestRecordingPermissionsAsync, setAudioModeAsync, type RecordingOptions } from "expo-audio";
import { getS, update } from "./store";

/** Speech check endpoint (Supabase Edge Function that forwards the clip to a Kurmancî speech recogniser). */
export const STT_URL = process.env.EXPO_PUBLIC_STT_URL || "https://ppntnfpiqsynzenwiiha.supabase.co/functions/v1/juji-stt";
const APP_TOKEN = "juji-app-1";

/** Small mono AAC clip: a 3 s word is ~12 KB. */
export const REC_OPTS: RecordingOptions = {
  extension: ".m4a", sampleRate: 16000, numberOfChannels: 1, bitRate: 32000,
  android: { extension: ".m4a", outputFormat: "mpeg4", audioEncoder: "aac", sampleRate: 16000 },
  ios: { extension: ".m4a", outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.MEDIUM, sampleRate: 16000 },
  web: { mimeType: "audio/webm" },
};

/** Speaking exercises are on, and not paused by «I can't speak now». */
export const speakOn = () => { const s = getS(); return s.set.voice && s.set.speak && Date.now() > (s.speakPause || 0); };
export const pauseSpeak = (min = 15) => update((x) => { x.speakPause = Date.now() + min * 60_000; });

export async function micAllowed(): Promise<boolean> {
  try { const r = await requestRecordingPermissionsAsync(); return r.granted; } catch { return false; }
}
export async function recMode(on: boolean) {
  try { await setAudioModeAsync(on ? { allowsRecording: true, playsInSilentMode: true } : { allowsRecording: false, playsInSilentMode: true, interruptionMode: "mixWithOthers" }); } catch {}
}

export class SttError extends Error { constructor(public kind: "net" | "server" | "empty") { super(kind); } }

/** Send the recording and get back what the recogniser heard. */
export async function recognize(uri: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", { uri, name: "say.m4a", type: "audio/mp4" } as unknown as Blob);
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 15000);
  let r: Response;
  try { r = await fetch(STT_URL, { method: "POST", body: fd, headers: { "x-juji-app": APP_TOKEN }, signal: ctl.signal }); }
  catch { throw new SttError("net"); } finally { clearTimeout(tm); }
  if (!r.ok) throw new SttError("server");
  const j = (await r.json().catch(() => ({}))) as { text?: string };
  const text = (j.text || "").trim();
  if (!text) throw new SttError("empty");
  return text;
}

/* ---------- comparing what was said with the target ---------- */
const FOLD: Record<string, string> = { ê: "e", î: "i", û: "u", ç: "c", ş: "s", â: "a", é: "e", ı: "i", ğ: "g", ö: "o", ü: "u" };
export const fold = (s: string) =>
  s.normalize("NFC").toLocaleLowerCase("en-US").replace(/[.,!?¿;:'’"«»…\-–—()]/g, " ").replace(/[êîûçşâéığöü]/g, (c) => FOLD[c] ?? c).replace(/\s+/g, " ").trim();
function lev(a: string, b: string) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
/** 0..1 — how close the heard text is to the target, forgiving accents and a little recogniser noise. */
export function closeness(heard: string, target: string): number {
  const h = fold(heard), t = fold(target);
  if (!t) return 0;
  const whole = 1 - lev(h, t) / Math.max(t.length, 1);
  const tw = t.split(" "), hw = h.split(" ");
  const hit = tw.filter((w) => hw.some((x) => lev(x, w) <= (w.length > 5 ? 2 : w.length > 2 ? 1 : 0))).length / tw.length;
  return Math.max(whole, hit);
}
export const PASS = 0.75;
