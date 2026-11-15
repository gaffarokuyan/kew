import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { AUDIO } from "@/content/audioMap";
import { getS } from "./store";

const key = (s: string) => s.normalize("NFC").trim();
const strip = (s: string) => key(s.replace(/[.,!?;:…«»]+/g, ""));
export function audioFor(text: string): number | undefined {
  const k = key(text), k2 = strip(text);
  return AUDIO[k] ?? AUDIO[k2] ?? AUDIO[k2.toLowerCase()];
}
export const hasAudio = (text: string) => audioFor(text) != null;

let voice: AudioPlayer | null = null;
const fx: Record<string, AudioPlayer> = {};
const taps: AudioPlayer[] = []; let tapI = 0;
const SFX = {
  ok: require("../../assets/sfx/ok.mp3"), bad: require("../../assets/sfx/bad.mp3"), tap: require("../../assets/sfx/tap.wav"),
  combo: require("../../assets/sfx/combo.mp3"), win: require("../../assets/sfx/win.mp3"), chest: require("../../assets/sfx/chest.mp3"),
  fire: require("../../assets/sfx/fire.mp3"),
};
export type Sfx = keyof typeof SFX;

export async function initAudio() {
  try { await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers", shouldPlayInBackground: false }); } catch {}
  voice = createAudioPlayer(null);
  (Object.keys(SFX) as Sfx[]).forEach((k) => { fx[k] = createAudioPlayer(SFX[k]); fx[k].volume = 0.6; });
  // taps come fast: keep a few pre-rewound players so a tap never waits for a seek
  for (let i = 0; i < 3; i++) {
    const p = createAudioPlayer(SFX.tap); p.volume = 0.5;
    p.addListener("playbackStatusUpdate", (st) => { if (st.didJustFinish) p.seekTo(0).catch(() => {}); });
    taps.push(p);
  }
}

/** Plays the recording of a Kurmancî word or sentence. Returns false when no recording exists. */
export function speak(text: string, slow = false, onEnd?: () => void): boolean {
  const s = getS();
  if (!s.set.voice || !text || !voice) return false;
  const src = audioFor(text);
  if (src == null) return false;
  try {
    voice.pause();
    voice.replace(src);
    voice.shouldCorrectPitch = true;
    voice.setPlaybackRate(slow ? 0.72 : s.set.rate || 1, "high");
    if (onEnd) {
      const sub = voice.addListener("playbackStatusUpdate", (st) => { if (st.didJustFinish) { sub.remove(); onEnd(); } });
    }
    voice.play();
    return true;
  } catch { return false; }
}
export function stopVoice() { try { voice?.pause(); } catch {} }

export function sfx(name: Sfx) {
  const s = getS();
  if (name === "ok" || name === "win" || name === "chest") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (name === "bad") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
  if (!s.set.sfx) return;
  if (name === "tap" && taps.length) { const p = taps[tapI++ % taps.length]; try { p.play(); } catch {} return; }
  const p = fx[name]; if (!p) return;
  try { p.seekTo(0); p.play(); } catch {}
}
