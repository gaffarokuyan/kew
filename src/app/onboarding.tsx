import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { LEVELS, levelFirstUnit, UNITS, type Level } from "@/lib/course";
import { LANGS, T, t, t2, tArr } from "@/lib/i18n";
import { type Lang, update, useS } from "@/lib/store";
import { Diamond, Kew, KilimRule, Medallion } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Btn, Lead, Title, toast } from "@/ui/kit";
import { F, levelCol, TS, useTheme } from "@/ui/theme";

/** Self-rated level → where a placement (jump) test could drop the learner. */
const TARGET: Record<number, Level> = { 2: "A2", 3: "B1" };
const LEVEL_CHOICES = [0, 1, 2, 3];

/** The highest course level at or below the wanted one that exists in the content and is not the very start. */
function jumpTarget(level: number) {
  const want = TARGET[level]; if (!want) return null;
  const order: Level[] = ["A1", "A2", "B1"];
  for (let i = order.indexOf(want); i > 0; i--) {
    const l = order[i]; const u = LEVELS.includes(l) ? levelFirstUnit(l) : undefined;
    if (u && UNITS.indexOf(u) > 0) return { lvl: l, unit: u.id };
  }
  return null;
}

export default function Onboarding() {
  const th = useTheme(); const s = useS();
  const [step, setStep] = useState(s.lang ? 1 : 0);
  const jt = jumpTarget(s.level);
  const finish = (jump?: string) => {
    update((x) => { x.onboard = true; });
    router.replace("/(tabs)");
    if (jump) setTimeout(() => router.push({ pathname: "/lesson", params: { jump } }), 350);
    else if (s.level > 0) setTimeout(() => toast(t("heritageHint")), 700);
  };
  const goals = [10, 20, 30, 50], mins = [5, 10, 15, 20];
  const choice = (on: boolean) => ({ pressed }: { pressed: boolean }) => ({
    minHeight: 64, flexDirection: "row" as const, gap: 14, alignItems: "center" as const, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderTopLeftRadius: 4,
    backgroundColor: on ? th.skySoft : th.surface, borderWidth: on ? 2 : 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: on ? th.sky : th.line2,
  });
  const tap = () => { sfx("tap"); buzz("select"); };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 }}>
        <Animated.View key={step} entering={FadeInDown.duration(320)} style={{ width: "100%", maxWidth: 440, alignSelf: "center", gap: 18 }}>
          {step === 0 && <>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
              <Kew size={124} />
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <Text accessibilityRole="header" style={{ fontFamily: F.italicBold, fontSize: 64, lineHeight: 68, color: th.ink, letterSpacing: -1 }}>Kew</Text>
                <Text style={{ fontFamily: F.italic, fontSize: TS.md, color: th.muted }}>Kurmancî</Text>
              </View>
            </View>
            <KilimRule color={th.sor} accent={th.zer} h={14} seed={2} />
            <View style={{ gap: 2 }}>
              {(T.onbLang as string[]).map((l, i) => (
                <Text key={l} style={{ fontFamily: i === 0 ? F.serif : F.bodySemi, fontSize: i === 0 ? TS.lg + 2 : TS.sm, lineHeight: i === 0 ? 28 : 21, color: i === 0 ? th.ink : th.muted }}>{l}</Text>
              ))}
            </View>
            <View style={{ width: "100%", gap: 10 }}>
              {LANGS.map(([c, n, sub]) => (
                <Pressable key={c} onPress={() => { tap(); update((x) => { x.lang = c as Lang; }); setStep(1); }} accessibilityRole="button" accessibilityLabel={`${n}, ${sub}`} style={choice(false)}>
                  <Text style={{ flex: 1, fontFamily: F.display, fontSize: TS.lg + 2, color: th.ink }}>{n}</Text>
                  <Text style={{ fontFamily: F.body, color: th.muted }}>{sub}</Text>
                </Pressable>
              ))}
            </View>
          </>}
          {step === 1 && <>
            <Kew size={140} />
            <Title align="left" size={40}>{t("onbHi")}</Title>
            <Lead align="left">{t("onbHiText")}</Lead>
            <KilimRule color={th.kesk} accent={th.zer} h={12} seed={5} />
            <Btn title={t("letsGo")} onPress={() => setStep(2)} style={{ alignSelf: "stretch" }} />
          </>}
          {step === 2 && <>
            <Title align="left">{t("onbLevel")}</Title>
            <View style={{ width: "100%", gap: 10 }}>
              {LEVEL_CHOICES.map((i) => { const [a, b] = t2("lvl" + i); return (
                <Pressable key={i} onPress={() => { tap(); update((x) => { x.level = i; }); setStep(3); }} accessibilityRole="button" accessibilityLabel={`${a}. ${b}`} style={choice(false)}>
                  {/* Rising pips: how much Kurmancî the learner already has. */}
                  <View style={{ width: 34, flexDirection: "row", flexWrap: "wrap", gap: 2 }} importantForAccessibility="no-hide-descendants">
                    {[0, 1, 2, 3].map((k) => <Diamond key={k} size={10} filled={k <= i} color={k <= i ? th.zer : th.line2} />)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{a}</Text>
                    <Text style={{ fontFamily: F.body, color: th.muted }}>{b}</Text>
                  </View>
                </Pressable>); })}
            </View>
          </>}
          {step === 3 && <>
            <Title align="left">{t("onbGoal")}</Title><Lead align="left">{t("onbGoalText")}</Lead>
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              {goals.map((g, i) => { const on = s.goal === g; return (
                <Pressable key={g} onPress={() => { tap(); update((x) => { x.goal = g; }); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 12, borderWidth: on ? 2 : 1.5, borderBottomWidth: 4, borderColor: on ? th.sky : th.line2, backgroundColor: on ? th.skySoft : th.surface }}>
                  <Text style={{ fontFamily: F.bodyHeavy, color: on ? th.skyDeep : th.ink, fontSize: 14 }}>{tArr("goals")[i]}</Text>
                  <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 12 }}>{t("min", { n: mins[i] })}</Text>
                </Pressable>); })}
            </View>
            <Btn title={t("setGoal")} onPress={() => (jt ? setStep(4) : finish())} style={{ alignSelf: "stretch" }} />
          </>}
          {step === 4 && jt && <>
            <View style={{ alignItems: "center", justifyContent: "center", alignSelf: "flex-start" }}>
              <Medallion size={120} color={levelCol(jt.lvl, th)} accent={th.zer} core={false} />
              <Text style={{ position: "absolute", fontFamily: F.display, fontSize: 34, color: levelCol(jt.lvl, th) }}>{jt.lvl}</Text>
            </View>
            <Title align="left">{t("onbJump", { l: jt.lvl })}</Title>
            <Lead align="left">{t("onbJumpText", { l: jt.lvl })}</Lead>
            <Btn title={t("startTest")} onPress={() => finish(jt.unit)} style={{ alignSelf: "stretch" }} />
            <Btn title={t("onbFromStart")} kind="ghost" onPress={() => finish()} style={{ alignSelf: "stretch" }} />
          </>}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
