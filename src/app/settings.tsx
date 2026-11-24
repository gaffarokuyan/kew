import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { speak } from "@/lib/audio";
import { LANGS, M, t, tArr } from "@/lib/i18n";
import { type Lang, resetAll, setCkbScript, switchCourse, update, useS } from "@/lib/store";
import { coursesFor, type CourseId, type Script } from "@/lib/course";
import { CourseRow } from "@/ui/CourseBadge";
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
function L({ children }: { children: string }) { const th = useTheme(); return <Text style={{ fontFamily: F.bodyHeavy, color: th.ink, fontSize: 16 }}>{children}</Text>; }
function Note({ children }: { children: React.ReactNode }) { const th = useTheme(); return <Text style={{ fontFamily: F.body, color: th.muted, fontSize: TS.sm, lineHeight: 20 }}>{children}</Text>; }
/** A settings group: small caps title over a soft card. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const th = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1, color: th.muted, marginLeft: 4 }}>{title.toLocaleUpperCase()}</Text>
      <View style={{ gap: 12, padding: 14, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>{children}</View>
    </View>);
}
function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  const th = useTheme();
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, borderBottomWidth: last ? 0 : 1, borderColor: th.line }}><L>{label}</L>{children}</View>;
}

export default function Settings() {
  const th = useTheme(); const s = useS(); const [armed, setArmed] = useState(false);
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 64, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xxl, color: th.ink }}>{t("settings")}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Card title={t("course")}>
          <View style={{ gap: 10 }}>
            {coursesFor(s.lang).map((c) => (
              <CourseRow key={c.id} id={c.id} name={c.name} sub={M(c.sub)} beta={c.beta ? t("courseBeta") : undefined} on={s.course === c.id}
                onPress={() => { if (c.id === "ckb" && !s.ckbScript) setCkbScript("both"); switchCourse(c.id as CourseId); }} />))}
          </View>
          {s.course === "zza" ? <Note>{t("courseNoteZza")}</Note> : null}
          {s.course === "eng" ? <Note>{t("courseNoteEng")}</Note> : null}
          {s.course === "ckb" ? <><L>{t("scriptSet")}</L>
            <Seg items={[{ v: "ar", l: t("scriptAr") }, { v: "lat", l: t("scriptLat") }, { v: "both", l: t("scriptBoth") }]} value={s.ckbScript || "both"} onPick={(v) => setCkbScript(v as Script)} /></> : null}
        </Card>

        <Card title={t("baseLang")}>
          <Seg items={LANGS.map(([c, n]) => ({ v: c, l: n }))} value={s.lang || "tr"} onPick={(v) => { if (!coursesFor(v).some((c) => c.id === s.course)) switchCourse("kmr"); update((x) => { x.lang = v as Lang; }); }} />
        </Card>

        <Card title={t("setSound")}>
          <Row label={t("sfx")}><Switch value={s.set.sfx} onValueChange={(v) => update((x) => { x.set.sfx = v; })} trackColor={{ true: th.kesk }} /></Row>
          <Row label={t("voice")}><Switch value={s.set.voice} onValueChange={(v) => update((x) => { x.set.voice = v; })} trackColor={{ true: th.kesk }} /></Row>
          <Row label={t("speakSet")} last><Switch value={s.set.speak} onValueChange={(v) => update((x) => { x.set.speak = v; x.speakPause = 0; })} trackColor={{ true: th.kesk }} /></Row>
          <L>{t("rate")}</L>
          <Seg items={[0.85, 1, 1.2].map((r, i) => ({ v: r, l: tArr("rates")[i] }))} value={s.set.rate} onPick={(v) => { update((x) => { x.set.rate = v; }); setTimeout(() => speak(s.course === "eng" ? "Hello, how are you?" : "Silav, tu çawa yî?"), 50); }} />
          <Btn title={t("testVoice")} upper={false} kind="ghost" icon={<Icon.spk size={20} color={th.ink} />} onPress={() => speak(s.course === "eng" ? "Hello, how are you?" : "Silav, tu çawa yî?")} />
          <Note>{t("voiceNotePack", { n: Object.keys(AUDIO).length })} {t("speakNote")}</Note>
        </Card>

        <Card title={t("dailyGoal")}>
          <Seg items={[10, 20, 30, 50].map((g, i) => ({ v: g, l: tArr("goals")[i], sub: t("minDay", { n: [5, 10, 15, 20][i] }) }))} value={s.goal} onPick={(v) => update((x) => { x.goal = v; })} />
          {Platform.OS !== "web" ? <>
            <Row label={t("remind")} last={!s.remind?.on}><Switch value={!!s.remind?.on} onValueChange={async (v) => {
              const ok = v ? await askReminder() : true;
              update((x) => { x.remind = { on: v && ok, h: x.remind?.h ?? 19, m: x.remind?.m ?? 0 }; }); scheduleReminders();
              if (v && !ok) toast(t("remindDenied"));
            }} trackColor={{ true: th.kesk }} /></Row>
            {s.remind?.on ? <Seg items={[[8, 0], [12, 30], [19, 0], [21, 0]].map(([h, m]) => ({ v: h * 60 + m, l: `${h}:${String(m).padStart(2, "0")}` }))} value={(s.remind.h * 60 + s.remind.m)}
              onPick={(v) => { update((x) => { x.remind = { on: true, h: Math.floor(v / 60), m: v % 60 }; }); scheduleReminders(); }} /> : null}
          </> : null}
        </Card>

        <Pressable onPress={() => { if (!armed) return setArmed(true); resetAll(); router.replace("/"); }} accessibilityRole="button" style={{ alignItems: "center", justifyContent: "center", minHeight: 48, padding: 10, borderRadius: 14, borderWidth: 1.5, borderColor: armed ? th.sor : th.line2 }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: th.sorDeep }}>{armed ? t("resetSure") : t("reset")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
