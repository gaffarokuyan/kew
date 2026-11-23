import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { CULTURE, weekCard, type CultureCard } from "@/lib/culture";
import { shuffle } from "@/lib/exercises";
import { M, t } from "@/lib/i18n";
import { addXP, update, useStore } from "@/lib/store";
import { KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

type Card = CultureCard;
const NONE: Record<string, number> = {};

/** «Kültür köşesi»: a short weekly read about Kurdish culture with a two-question check; past cards stay readable. */
export default function Culture() {
  const th = useTheme();
  const seenRaw = useStore((s) => s.culture); const seen = seenRaw ?? NONE;
  const [card, setCard] = useState<Card>(weekCard());
  const [step, setStep] = useState<"read" | "quiz" | "done">("read");
  const [qi, setQi] = useState(0); const [sel, setSel] = useState<number | null>(null); const [right, setRight] = useState(0);
  const [opts, setOpts] = useState<{ o: string; ok: boolean }[]>([]);
  const ask = (i: number) => { setQi(i); setSel(null); setOpts(shuffle(card.quiz[i].o.map((o, k) => ({ o, ok: k === card.quiz[i].a })))); };
  const open = (c: Card) => { sfx("tap"); setCard(c); setStep("read"); setRight(0); };
  const finish = () => {
    const first = !seen[card.id];
    update((s) => { s.culture = { ...(s.culture ?? {}), [card.id]: Date.now() }; });
    addXP(first ? 10 + right * 2 : 2); sfx("win"); buzz("win"); confetti(); setStep("done");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 60 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("cultTitle")}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        {step === "read" ? (
          <Animated.View key={card.id} entering={FadeInDown.duration(260)} style={{ gap: 14 }}>
            <View style={{ borderRadius: 18, borderTopLeftRadius: 4, backgroundColor: th.panel, overflow: "hidden" }}>
              <KilimRule color={th.zer} accent={th.sor} h={12} seed={card.id.length * 7} style={{ marginTop: 12, marginHorizontal: 12, width: undefined }} />
              <View style={{ padding: 18, gap: 8 }}>
                <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: "rgba(246,240,228,0.75)" }}>{card === weekCard() ? t("cultWeek") : t("cultTitle")}</Text>
                <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 36, color: th.panelInk }}>{card.title}</Text>
                <Text style={{ fontFamily: F.italicBold, fontSize: TS.lg, color: th.zer }}>{card.ku}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: F.body, fontSize: 18, lineHeight: 29, color: th.ink }}>{M(card.text)}</Text>
            <Btn title={t("cultQuiz")} onPress={() => { setRight(0); ask(0); setStep("quiz"); }} />
          </Animated.View>
        ) : step === "quiz" ? (
          <Animated.View key={qi} entering={FadeInDown.duration(220)} style={{ gap: 12 }}>
            <Text style={{ fontFamily: F.italicBold, fontSize: TS.md, color: th.keskDeep }}>{qi + 1} / {card.quiz.length}</Text>
            <Text style={{ fontFamily: F.display, fontSize: 26, lineHeight: 32, color: th.ink }}>{M(card.quiz[qi].q)}</Text>
            {opts.map((o, i) => {
              const bc = sel != null ? (o.ok ? th.kesk : i === sel ? th.sor : th.line2) : th.line2;
              return <Pressable key={i} disabled={sel != null} onPress={() => { setSel(i); sfx(o.ok ? "ok" : "bad"); buzz(o.ok ? "ok" : "bad"); if (o.ok) setRight((r) => r + 1); }} accessibilityRole="button"
                style={{ minHeight: 56, justifyContent: "center", padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: bc, backgroundColor: th.surface }}>
                <Text style={{ fontFamily: F.bodySemi, fontSize: 17, color: th.ink }}>{M(o.o)}</Text></Pressable>;
            })}
            {sel != null ? <Btn title={t("cont")} onPress={() => (qi + 1 < card.quiz.length ? ask(qi + 1) : finish())} /> : null}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(260)} style={{ gap: 12, alignItems: "stretch", paddingTop: 20 }}>
            <Text style={{ fontFamily: F.display, fontSize: 30, color: th.ink, textAlign: "center" }}>{t("cultDone")}</Text>
            <Text style={{ fontFamily: F.bodySemi, fontSize: TS.lg, color: th.muted, textAlign: "center" }}>{right} / {card.quiz.length}</Text>
            <Btn title={t("contOn")} onPress={() => setStep("read")} />
          </Animated.View>
        )}

        <KilimRule color={th.zer} accent={th.sor} h={10} seed={3} />
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.sm, color: th.muted }}>{t("cultAll")}</Text>
        <View style={{ gap: 8 }}>
          {CULTURE.map((c) => (
            <Pressable key={c.id} onPress={() => open(c)} accessibilityRole="button"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderTopLeftRadius: 3, borderWidth: 1.5, borderColor: c === card ? th.plum : th.line2, backgroundColor: th.surface }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, transform: [{ rotate: "45deg" }], backgroundColor: seen[c.id] ? th.kesk : th.line2 }} />
              <Text style={{ flex: 1, fontFamily: F.serif, fontSize: TS.md, color: th.ink }}>{c.title}</Text>
              {c === weekCard() ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, color: th.zerDeep }}>{t("cultNew")}</Text> : null}
            </Pressable>))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
