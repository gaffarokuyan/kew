import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { speak } from "@/lib/audio";
import { LANGS, t, tArr } from "@/lib/i18n";
import { type Lang, resetAll, update, useS } from "@/lib/store";
import { Icon } from "@/ui/icons";
import { Btn } from "@/ui/kit";
import { F, useTheme } from "@/ui/theme";

function Seg<T extends string | number>({ items, value, onPick }: { items: { v: T; l: string; sub?: string }[]; value: T; onPick: (v: T) => void }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {items.map((it) => { const on = it.v === value; return (
        <Pressable key={String(it.v)} onPress={() => onPick(it.v)} accessibilityRole="button" accessibilityState={{ selected: on }}
          style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: on ? th.sky : th.line, backgroundColor: on ? th.skySoft : th.surface }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: on ? th.sky : th.ink, fontSize: 14 }}>{it.l}</Text>
          {it.sub ? <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 12 }}>{it.sub}</Text> : null}
        </Pressable>); })}
    </View>);
}
function L({ children }: { children: string }) { const th = useTheme(); return <Text style={{ fontFamily: F.bodyHeavy, color: th.ink, fontSize: 16 }}>{children}</Text>; }

export default function Settings() {
  const th = useTheme(); const s = useS(); const [armed, setArmed] = useState(false);
  const row = { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 } as const;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 56 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: 24, color: th.ink }}>{t("settings")}</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel={t("close")} hitSlop={10}><Icon.x size={24} color={th.faint} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 20, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ gap: 8 }}><L>{t("baseLang")}</L><Seg items={LANGS.map(([c, n]) => ({ v: c, l: n }))} value={s.lang || "tr"} onPick={(v) => update((x) => { x.lang = v as Lang; })} /></View>
        <View style={row}><L>{t("sfx")}</L><Switch value={s.set.sfx} onValueChange={(v) => update((x) => { x.set.sfx = v; })} trackColor={{ true: th.kesk }} /></View>
        <View style={row}><L>{t("voice")}</L><Switch value={s.set.voice} onValueChange={(v) => update((x) => { x.set.voice = v; })} trackColor={{ true: th.kesk }} /></View>
        <View style={{ gap: 8 }}><L>{t("rate")}</L>
          <Seg items={[0.85, 1, 1.2].map((r, i) => ({ v: r, l: tArr("rates")[i] }))} value={s.set.rate} onPick={(v) => { update((x) => { x.set.rate = v; }); setTimeout(() => speak("Silav, tu çawa yî?"), 50); }} />
        </View>
        <View style={{ gap: 8 }}><L>{t("dailyGoal")}</L>
          <Seg items={[10, 20, 30, 50].map((g, i) => ({ v: g, l: tArr("goals")[i], sub: `${g} XP` }))} value={s.goal} onPick={(v) => update((x) => { x.goal = v; })} />
        </View>
        <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 13 }}>{t("voiceNotePack", { n: 1412 })}</Text>
        <Btn title={t("testVoice")} upper={false} kind="ghost" icon={<Icon.spk size={20} color={th.ink} />} onPress={() => speak("Silav, tu çawa yî?")} />
        <Pressable onPress={() => { if (!armed) return setArmed(true); resetAll(); router.replace("/"); }} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: th.sor }}>{armed ? t("resetSure") : t("reset")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
