import type { Episode } from "@/lib/podcast";

/** Web build: the browser caches audio itself, so offline download is not offered. */
export const canOffline = false;
export const localAudio = (_e: Episode): string | null => null;
export const download = async (_e: Episode) => false;
export const removeLocal = (_e: Episode) => {};
export const offlineSize = () => 0;
