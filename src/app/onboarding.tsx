import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { LANGS, T, t, t2, tArr } from "@/lib/i18n";
import { type Lang, update, useS } from "@/lib/store";
import { Kew } from "@/ui/art";
import { Btn, Lead, Title, toast } from "@/ui/kit";
import { F, useTheme } from "@/ui/theme";

export default function Onboarding() {
  const th = useTheme(); const s = useS();
  const [step, setStep] = useState(s.lang ? 1 : 0);
  const finish = () => {
    update((x) => { x.onboard = true; });
    router.replace("/(tabs)");
    if (s.level > 0) setTimeout(() => toast(t("heritageHint")), 700);
  };
  const goals = [10, 20, 30, 50], mins = [5, 10, 15, 20];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 22, gap: 18 }}>
        <Animated.View key={step} entering={FadeInDown.duration(320)} style={{ width: "100%", maxWidth: 440, alignItems: "center", gap: 18 }}>
          <Kew size={step === 0 ? 150 : 128} />
          {step === 0 && <>
            <Title>Kew</Title>
            <Lead>{(T.onbLang as string[]).join("\n")}</Lead>
            <View style={{ width: "100%", gap: 10 }}>
              {LANGS.map(([c, n, sub]) => (
                <Pressable key={c} onPress={() => { sfx("tap"); update((x) => { x.lang = c as Lang; }); setStep(1); }} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: th.surface, borderWidth: 2, borderBottomWidth: pressed ? 2 : 5, marginTop: pressed ? 3 : 0, borderColor: th.line })}>
                  <Text style={{ fontFamily: F.bodyHeavy, fontSize: 18, color: th.ink }}>{n}</Text>
                  <Text style={{ fontFamily: F.body, color: th.muted }}>{sub}</Text>
                </Pressable>
              ))}
            </View>
          </>}
          {step === 1 && <>
            <Title>{t("onbHi")}</Title><Lead>{t("onbHiText")}</Lead>
            <Btn title={t("letsGo")} onPress={() => setStep(2)} style={{ alignSelf: "stretch" }} />
          </>}
          {step === 2 && <>
            <Title>{t("onbLevel")}</Title>
            <View style={{ width: "100%", gap: 10 }}>
              {[0, 1, 2].map((i) => { const [a, b] = t2("lvl" + i); return (
                <Pressable key={i} onPress={() => { sfx("tap"); update((x) => { x.level = i; }); setStep(3); }} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: th.surface, borderWidth: 2, borderBottomWidth: pressed ? 2 : 5, marginTop: pressed ? 3 : 0, borderColor: th.line })}>
                  <Text style={{ width: 30, height: 30, lineHeight: 26, textAlign: "center", borderRadius: 8, borderWidth: 2, borderColor: th.line, color: th.faint, fontFamily: F.bodyHeavy }}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.bodyHeavy, fontSize: 17, color: th.ink }}>{a}</Text>
                    <Text style={{ fontFamily: F.body, color: th.muted }}>{b}</Text>
                  </View>
                </Pressable>); })}
            </View>
          </>}
          {step === 3 && <>
            <Title>{t("onbGoal")}</Title><Lead>{t("onbGoalText")}</Lead>
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              {goals.map((g, i) => { const on = s.goal === g; return (
                <Pressable key={g} onPress={() => { sfx("tap"); update((x) => { x.goal = g; }); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: on ? th.sky : th.line, backgroundColor: on ? th.skySoft : th.surface }}>
                  <Text style={{ fontFamily: F.bodyHeavy, color: on ? th.sky : th.ink, fontSize: 14 }}>{tArr("goals")[i]}</Text>
                  <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 12 }}>{t("min", { n: mins[i] })}</Text>
                </Pressable>); })}
            </View>
            <Btn title={t("setGoal")} onPress={finish} style={{ alignSelf: "stretch" }} />
          </>}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
