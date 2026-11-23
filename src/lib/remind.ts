import { Platform } from "react-native";
import { M } from "./i18n";
import { day, getS } from "./store";

/**
 * Daily practice reminder (local notifications only, nothing leaves the phone).
 * We schedule one-off reminders for the next 7 days at the chosen time and skip today once the goal is done,
 * so a learner who already practised is never nagged. Rescheduled on app start and after every lesson.
 */
const LINES = [
  "Juji li benda te ye! 🦔|Juji is waiting for you to practise for 5 minutes.|Juji wartet auf dich: 5 Minuten üben?",
  "Rojeke din, peyveke nû. Bugünün kelimesi seni bekliyor.|A new day, a new word. Today's word is waiting.|Ein neuer Tag, ein neues Wort. Das Wort des Tages wartet.",
  "Serini koru: kısa bir ders yeter. 🔥|Keep your streak alive: one short lesson is enough. 🔥|Halte deine Serie: eine kurze Lektion reicht. 🔥",
  "Dengê te li ku ye? Bugün bir cümle söyle.|Say one sentence out loud today.|Sag heute einen Satz laut.",
];
const TITLE = "Juji · Kurdî|Juji · Kurdish|Juji · Kurdisch";

type N = typeof import("expo-notifications");
let mod: N | null | undefined;
async function lib(): Promise<N | null> {
  if (Platform.OS === "web") return null;
  if (mod === undefined) { try { mod = await import("expo-notifications"); } catch { mod = null; } }
  return mod;
}

/** Ask for permission (Android 13+ / iOS). Returns true when reminders can be shown. */
export async function askReminder(): Promise<boolean> {
  const N = await lib(); if (!N) return false;
  if (Platform.OS === "android") await N.setNotificationChannelAsync("daily", { name: "Daily reminder", importance: N.AndroidImportance.DEFAULT });
  const cur = await N.getPermissionsAsync();
  if (cur.granted) return true;
  const r = await N.requestPermissionsAsync();
  return r.granted;
}

export async function scheduleReminders() {
  const N = await lib(); if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    const s = getS(); const r = s.remind;
    if (!r?.on) return;
    if (!(await N.getPermissionsAsync()).granted) return;
    if (Platform.OS === "android") await N.setNotificationChannelAsync("daily", { name: "Daily reminder", importance: N.AndroidImportance.DEFAULT });
    const doneToday = s.daily.date === day() && s.daily.xp >= s.goal;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i); d.setHours(r.h, r.m, 0, 0);
      if (d.getTime() <= Date.now() + 60_000 || (i === 0 && doneToday)) continue;
      await N.scheduleNotificationAsync({
        content: { title: M(TITLE), body: M(LINES[(d.getDate() + i) % LINES.length]), data: { url: "/" } },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: d, channelId: "daily" },
      });
    }
  } catch { /* reminders are best-effort */ }
}
