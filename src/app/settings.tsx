import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { speak } from "@/lib/audio";
import { LANGS, M, t, tArr } from "@/lib/i18n";
import { type Lang, resetAll, setCkbScript, switchCourse, update, useS } from "@/lib/store";
import { COURSES, type CourseId, type Script } from "@/lib/course";
import { Icon } from "@/ui/icons";
import { Btn, toast } from "@/ui/kit";
import { askReminder, scheduleReminders } from "@/lib/remind";
import { AUDIO } from "@/content/audioMap";
import { F, TS, useTheme } from "@/ui/theme";

function Seg<T extends string | number>({ items, value, onPick }: { items: { v: T; l: string; sub?: string }[]; value: T; onPick: (v: T) => void }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {items.map((it) => { const on = it.v === value; return (
        <Pressable key={String(it.v)} onPress={() => onPick(it.v)} accessibilityRole="button" accessibilityState={{ selected: on }}
          style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 10, borderWidth: on ? 2 : 1.5, borderColor: on ? th.sky : th.line2, backgroundColor: on ? th.skySoft : th.surface }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: on ? th.skyDeep : th.ink, fontSize: 14 }}>{it.l}</Text>
          {it.sub ? <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 12 }}>{it.sub}</Text> : null}
        </Pressable>); })}
    </View>);
}
function L({ children }: { children: string }) { const th = useTheme(); return <Text style={{ fontFamily: F.serif, color: th.ink, fontSize: TS.lg }}>{children}</Text>; }

export default function Settings() {
  const th = useTheme(); const s = useS(); const [armed, setArmed] = useState(false);
  const row = { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52, borderTopWidth: 1, borderBottomWidth: 1, borderColor: th.line } as const;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 64, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xxl, color: th.ink }}>{t("settings")}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, gap: 22, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ gap: 8 }}><L>{t("course")}</L>
          <Seg items={COURSES.map((c) => ({ v: c.id, l: c.name, sub: c.beta ? t("courseBeta") : M(c.sub) }))} value={s.course} onPick={(v) => { if (v === "ckb" && !s.ckbScript) setCkbScript("both"); switchCourse(v as CourseId); }} />
          {s.course === "zza" ? <Text style={{ fontFamily: F.italic, color: th.muted, fontSize: TS.sm }}>{t("courseNoteZza")}</Text> : null}
          {s.course === "ckb" ? <><L>{t("scriptSet")}</L>
            <Seg items={[{ v: "ar", l: t("scriptAr") }, { v: "lat", l: t("scriptLat") }, { v: "both", l: t("scriptBoth") }]} value={s.ckbScript || "both"} onPick={(v) => setCkbScript(v as Script)} /></> : null}
        </View>
        <View style={{ gap: 8 }}><L>{t("baseLang")}</L><Seg items={LANGS.map(([c, n]) => ({ v: c, l: n }))} value={s.lang || "tr"} onPick={(v) => update((x) => { x.lang = v as Lang; })} /></View>
        <View style={{ gap: 0 }}>
        <View style={row}><L>{t("sfx")}</L><Switch value={s.set.sfx} onValueChange={(v) => update((x) => { x.set.sfx = v; })} trackColor={{ true: th.kesk }} /></View>
        <View style={[row, { borderTopWidth: 0 }]}><L>{t("voice")}</L><Switch value={s.set.voice} onValueChange={(v) => update((x) => { x.set.voice = v; })} trackColor={{ true: th.kesk }} /></View>
        <View style={[row, { borderTopWidth: 0 }]}><L>{t("speakSet")}</L><Switch value={s.set.speak} onValueChange={(v) => update((x) => { x.set.speak = v; x.speakPause = 0; })} trackColor={{ true: th.kesk }} /></View>
        </View>
        {Platform.OS !== "web" ? <View style={{ gap: 8 }}>
          <View style={[row, { borderTopWidth: 0, paddingHorizontal: 0 }]}><L>{t("remind")}</L><Switch value={!!s.remind?.on} onValueChange={async (v) => {
            const ok = v ? await askReminder() : true;
            update((x) => { x.remind = { on: v && ok, h: x.remind?.h ?? 19, m: x.remind?.m ?? 0 }; }); scheduleReminders();
            if (v && !ok) toast(t("remindDenied"));
          }} trackColor={{ true: th.kesk }} /></View>
          {s.remind?.on ? <Seg items={[[8, 0], [12, 30], [19, 0], [21, 0]].map(([h, m]) => ({ v: h * 60 + m, l: `${h}:${String(m).padStart(2, "0")}` }))} value={(s.remind.h * 60 + s.remind.m)}
            onPick={(v) => { update((x) => { x.remind = { on: true, h: Math.floor(v / 60), m: v % 60 }; }); scheduleReminders(); }} /> : null}
        </View> : null}
        <View style={{ gap: 8 }}><L>{t("rate")}</L>
          <Seg items={[0.85, 1, 1.2].map((r, i) => ({ v: r, l: tArr("rates")[i] }))} value={s.set.rate} onPick={(v) => { update((x) => { x.set.rate = v; }); setTimeout(() => speak("Silav, tu çawa yî?"), 50); }} />
        </View>
        <View style={{ gap: 8 }}><L>{t("dailyGoal")}</L>
          <Seg items={[10, 20, 30, 50].map((g, i) => ({ v: g, l: tArr("goals")[i], sub: `${g} XP` }))} value={s.goal} onPick={(v) => update((x) => { x.goal = v; })} />
        </View>
        <Text style={{ fontFamily: F.italic, color: th.muted, fontSize: TS.sm }}>{t("voiceNotePack", { n: Object.keys(AUDIO).length })}</Text>
        <Text style={{ fontFamily: F.italic, color: th.muted, fontSize: TS.sm }}>{t("speakNote")}</Text>
        <Btn title={t("testVoice")} upper={false} kind="ghost" icon={<Icon.spk size={20} color={th.ink} />} onPress={() => speak("Silav, tu çawa yî?")} />
        <Pressable onPress={() => { if (!armed) return setArmed(true); resetAll(); router.replace("/"); }} accessibilityRole="button" style={{ alignItems: "center", justifyContent: "center", minHeight: 48, padding: 10 }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: th.sorDeep }}>{armed ? t("resetSure") : t("reset")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
