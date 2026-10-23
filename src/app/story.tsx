import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { hasAudio, speak, sfx, stopVoice } from "@/lib/audio";
import { NODE, UNIT } from "@/lib/course";
import { shuffle } from "@/lib/exercises";
import { M, t, up, kuUp } from "@/lib/i18n";
import { addXP, getS, update } from "@/lib/store";
import { Avatar, Sun } from "@/ui/art";
import { Icon } from "@/ui/icons";
import { Btn, confetti, toast } from "@/ui/kit";
import { F, useTheme } from "@/ui/theme";

export default function Story() {
  const { node } = useLocalSearchParams<{ node: string }>();
  const th = useTheme(); const ins = useSafeAreaInsets();
  const n = NODE[node]; const st = UNIT[n.unit].story!;
  const me = st.lines.find((l) => l[3])?.[0];
  const [i, setI] = useState(1); const [sel, setSel] = useState<string | null>(null); const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState<null | { xp: number; streakUp: boolean }>(null);
  const mistakes = useRef(0); const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const shown = st.lines.slice(0, i), cur = st.lines[i], q = cur?.[3];
  const opts = useMemo(() => (q ? shuffle(q.options) : []), [i]);
  useEffect(() => { const l = shown[shown.length - 1]; const tm = setTimeout(() => { speak(l[1]); scroll.current?.scrollToEnd({ animated: true }); }, 200); return () => clearTimeout(tm); }, [i]);
  useEffect(() => () => stopVoice(), []);

  const finish = () => {
    stopVoice(); const xp = 15 + (mistakes.current === 0 ? 5 : 0);
    const streakUp = addXP(xp);
    update((x) => { x.done[n.id] = true; x.stats.stories++; x.stats.lessons++; x.daily.lessons++; if (mistakes.current === 0) x.stats.perfect++; });
    sfx("win"); confetti(); setDone({ xp, streakUp });
  };
  const check = () => {
    if (!q || !sel) return;
    if (sel === q.options[0]) { sfx("ok"); setSel(null); setWrong([]); setI(i + 1); }
    else { sfx("bad"); mistakes.current++; setWrong((w) => [...w, sel]); setSel(null); toast(t("tryAgain")); }
  };

  if (done) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg, alignItems: "center", justifyContent: "center", padding: 22, gap: 18 }}>
      <Sun size={130} />
      <Text style={{ fontFamily: F.display, fontSize: 30, color: th.zerDeep, textAlign: "center" }}>{t("lessonDone")}</Text>
      <Text style={{ fontFamily: F.display, fontSize: 26, color: th.ink }}>+{done.xp} XP</Text>
      <Btn title={t("contOn")} onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, height: 56 }}>
        <Pressable onPress={() => { stopVoice(); router.back(); }} accessibilityLabel={t("quitAria")} hitSlop={10}><Icon.x size={26} color={th.faint} /></Pressable>
        <View style={{ flex: 1, height: 16, borderRadius: 99, backgroundColor: th.surface2, overflow: "hidden" }}>
          <View style={{ width: `${Math.round((i / st.lines.length) * 100)}%`, height: "100%", backgroundColor: th.kesk }} />
        </View>
        <Icon.heart size={24} color={th.sky} /><Text style={{ fontFamily: F.bodyHeavy, color: th.sky }}>∞</Text>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, gap: 14, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Icon.story size={18} color={th.kesk} /><Text style={{ fontFamily: F.bodyHeavy, fontSize: 13, letterSpacing: 1.4, color: th.kesk }}>{up(t("story"))}</Text></View>
        <Text style={{ fontFamily: F.display, fontSize: 28, color: th.ink }}>{st.title}</Text>
        {shown.map((l, k) => { const mine = l[0] === me; return (
          <Animated.View key={k} entering={FadeInUp.duration(260)} style={{ flexDirection: mine ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
            <Avatar name={l[0]} size={42} />
            <Pressable onPress={() => speak(l[1])} style={{ flexShrink: 1, padding: 12, borderRadius: 18, borderWidth: 2, borderColor: mine ? th.sky : th.line, backgroundColor: mine ? th.skySoft : th.surface, gap: 3 }}>
              <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 1.2, color: th.muted, textAlign: mine ? "right" : "left" }}>{kuUp(l[0])}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{hasAudio(l[1]) ? <Icon.spk size={16} color={th.sky} /> : null}<Text style={{ flexShrink: 1, fontFamily: F.bodyHeavy, fontSize: 18, color: th.ink }}>{l[1]}</Text></View>
              <Text style={{ fontFamily: F.body, color: th.muted }}>{M(l[2])}</Text>
            </Pressable>
          </Animated.View>); })}
        {q && <View style={{ padding: 14, borderRadius: 18, backgroundColor: th.surface2, gap: 10 }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: 16, color: th.ink }}>{M(q.q)}</Text>
          {opts.map((o) => { const bad = wrong.includes(o), on = sel === o; return (
            <Pressable key={o} disabled={bad} onPress={() => { sfx("tap"); setSel(o); speak(o); }}
              style={{ padding: 14, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: bad ? th.sor : on ? th.sky : th.line, backgroundColor: bad ? th.sorSoft : on ? th.skySoft : th.surface, opacity: bad ? 0.6 : 1 }}>
              <Text style={{ fontFamily: F.bodyHeavy, fontSize: 17, color: th.ink }}>{o}</Text></Pressable>); })}
        </View>}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: 16 + ins.bottom, borderTopWidth: 2, borderColor: th.line }}>
        {q ? <Btn title={t("check")} disabled={!sel} onPress={check} />
          : <Btn title={i >= st.lines.length ? t("finish") : t("cont")} onPress={() => (i >= st.lines.length ? finish() : setI(i + 1))} />}
      </View>
    </SafeAreaView>
  );
}
