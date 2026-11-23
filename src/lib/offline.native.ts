import { Directory, File, Paths } from "expo-file-system";
import type { Episode } from "@/lib/podcast";

/** Offline podcast audio (native): files live in documents/pods/<id>-<dur>.mp3 so a re-voiced episode gets a new name. */
const dir = () => new Directory(Paths.document, "pods");
const fileOf = (e: Episode) => new File(dir(), `${e.id}-${Math.round(e.dur ?? 0)}.mp3`);

export const canOffline = true;

export function localAudio(e: Episode): string | null {
  try { const f = fileOf(e); return f.exists ? f.uri : null; } catch { return null; }
}

export async function download(e: Episode): Promise<boolean> {
  if (!e.audio) return false;
  try {
    const d = dir(); if (!d.exists) d.create({ intermediates: true });
    for (const it of d.list()) if (it.name.startsWith(e.id + "-")) it.delete();
    const out = await File.downloadFileAsync(e.audio, fileOf(e));
    return out.exists;
  } catch { return false; }
}

export function removeLocal(e: Episode) {
  try { const f = fileOf(e); if (f.exists) f.delete(); } catch {}
}

export function offlineSize(): number {
  try { const d = dir(); return d.exists ? d.size ?? 0 : 0; } catch { return 0; }
}
