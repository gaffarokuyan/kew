import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { COURSES, courseId, coursesFor, LEVELS, levelFirstUnit, NODES, UNITS, type CourseId, type Level } from "@/lib/course";
import { LANGS, M, T, t, t2, tArr } from "@/lib/i18n";
import { setCkbScript, switchCourse, type Lang, update, useS } from "@/lib/store";
import { ScriptOptions } from "@/ui/ScriptPicker";
import { Juji, KilimRule, Medallion } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Btn, Lead, Title, toast } from "@/ui/kit";
import { F, levelCol, TS, useTheme } from "@/ui/theme";

/** Self-rated level → where a placement (jump) test could drop the learner. */
const TARGET: Record<number, Level> = { 2: "A2", 3: "B1", 4: "B1" };
const LEVEL_CHOICES = [0, 1, 2, 3, 4];
/** A greeting and where each course is mostly spoken, shown on the course picker. */
const COURSE_SAMPLE: Record<CourseId, { hi: string; hiLat?: string; where: string }> = {
  kmr: { hi: "Silav, tu çawa yî?", where: "Bakur, Rojava, Başûr (Behdînan) ve diaspora|Bakur, Rojava, Başûr (Behdînan) and the diaspora|Bakur, Rojava, Başûr (Behdînan) und die Diaspora" },
  ckb: { hi: "سڵاو، چۆنی؟", hiLat: "Sillaw, çonî?", where: "Başûr (Hewlêr, Silêmanî) ve Rojhelat|Başûr (Hewlêr, Silêmanî) and Rojhelat|Başûr (Hewlêr, Silêmanî) und Rojhelat" },
  eng: { hi: "Hello, how are you?", where: "Dünyanın ortak dili: Türkçe üzerinden, A1'den B1'e|The world's common language|Die Weltsprache" },
  zza: { hi: "Merheba, ti senî yê?", where: "Dersim, Çewlîg, Palu, Sêwregi ve diaspora|Dersim, Çewlîg, Palu, Sêwregi and the diaspora|Dersim, Çewlîg, Palu, Sêwregi und die Diaspora" },
};

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
  const finish = (jump?: string, firstLesson?: boolean) => {
    update((x) => { x.onboard = true; });
    router.replace("/(tabs)");
    if (jump) setTimeout(() => router.push({ pathname: "/lesson", params: { jump } }), 350);
    else if (firstLesson && NODES[0]) setTimeout(() => router.push({ pathname: "/lesson", params: { node: NODES[0].id } }), 350);
    else if (s.level > 0) setTimeout(() => toast(t("heritageHint")), 700);
  };
  const afterGoal = () => setStep(jt ? 7 : 8);
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
              <Juji size={124} />
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <Text accessibilityRole="header" style={{ fontFamily: F.italicBold, fontSize: 64, lineHeight: 68, color: th.ink, letterSpacing: -1 }}>Juji</Text>
                <Text style={{ fontFamily: F.italic, fontSize: TS.md, color: th.muted }}>Kurmancî · Soranî · Kirmanckî</Text>
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
            <Juji size={140} />
            <Title align="left" size={40}>{t("onbHi")}</Title>
            <Lead align="left">{t("onbHiText")}</Lead>
            <KilimRule color={th.kesk} accent={th.zer} h={12} seed={5} />
            <Btn title={t("letsGo")} onPress={() => setStep(COURSES.length > 1 ? 5 : 2)} style={{ alignSelf: "stretch" }} />
          </>}
          {step === 5 && <>
            <Title align="left">{t("onbCourse")}</Title>
            <Lead align="left">{t("onbCourseText")}</Lead>
            <View style={{ width: "100%", gap: 10 }}>
              {coursesFor(s.lang).map((c) => { const smp = COURSE_SAMPLE[c.id]; const on = courseId() === c.id; return (
                <Pressable key={c.id} onPress={() => { tap(); switchCourse(c.id); setStep(c.id === "ckb" ? 6 : 2); }} accessibilityRole="button" accessibilityLabel={`${c.name}. ${M(c.sub)}`} style={choice(on)}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontFamily: F.display, fontSize: TS.lg + 2, color: th.ink }}>{c.name}</Text>
                      {c.beta ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, color: th.zerDeep, borderWidth: 1, borderColor: th.zer, borderRadius: 6, paddingHorizontal: 5 }}>{t("courseBeta")}</Text> : null}
                    </View>
                    <Text style={{ fontFamily: F.serif, fontSize: TS.md, color: th.ink, writingDirection: smp.hiLat ? "rtl" : "ltr", textAlign: "left" }}>{smp.hi}</Text>
                    {smp.hiLat ? <Text style={{ fontFamily: F.italic, fontSize: TS.sm, color: th.muted }}>{smp.hiLat}</Text> : null}
                    <Text style={{ fontFamily: F.body, fontSize: TS.sm, color: th.muted }}>{M(smp.where)}</Text>
                  </View>
                </Pressable>); })}
            </View>
          </>}
          {step === 6 && <ScriptOptions onPick={(m) => { tap(); setCkbScript(m); setStep(2); }} />}
          {step === 2 && <>
            <Ask key="lvl" text={t("onbLevel")} />
            <View style={{ width: "100%", gap: 10 }}>
              {LEVEL_CHOICES.map((i) => { const [a, b] = t2("lvl" + i); return (
                <Pressable key={i} onPress={() => { tap(); update((x) => { x.level = i; }); setStep(3); }} accessibilityRole="button" accessibilityLabel={`${a}. ${b}`} style={choice(false)}>
                  {/* Rising bars: how much the learner already has. */}
                  <Bars n={i + 1} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{a}</Text>
                    <Text style={{ fontFamily: F.body, color: th.muted }}>{b}</Text>
                  </View>
                </Pressable>); })}
            </View>
          </>}
          {step === 3 && <>
            <Ask text={t("onbGoal")} /><Lead align="left">{t("onbGoalText")}</Lead>
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              {goals.map((g, i) => { const on = s.goal === g; return (
                <Pressable key={g} onPress={() => { tap(); update((x) => { x.goal = g; }); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 12, borderWidth: on ? 2 : 1.5, borderBottomWidth: 4, borderColor: on ? th.sky : th.line2, backgroundColor: on ? th.skySoft : th.surface }}>
                  <Text style={{ fontFamily: F.bodyHeavy, color: on ? th.skyDeep : th.ink, fontSize: 14 }}>{tArr("goals")[i]}</Text>
                  <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 12 }}>{t("min", { n: mins[i] })}</Text>
                </Pressable>); })}
            </View>
            <Btn title={t("setGoal")} onPress={afterGoal} style={{ alignSelf: "stretch" }} />
          </>}
          {step === 7 && jt && <>
            <Ask text={t("onbWhere")} />
            <View style={{ width: "100%", gap: 12 }}>
              {[0, 1].map((k) => { const rec = (s.level >= 2 ? 1 : 0) === k; return (
                <Pressable key={k} onPress={() => { tap(); if (k === 0) setStep(8); else setStep(4); }} accessibilityRole="button" accessibilityLabel={`${t(k ? "onbKnowQ" : "onbNewQ")}. ${t(k ? "onbKnowSub" : "onbNewSub")}`}
                  style={({ pressed }) => ({ ...choice(rec)({ pressed }), minHeight: 96, paddingTop: 18 })}>
                  {rec ? <Text style={{ position: "absolute", top: -9, right: 12, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: th.sky, color: "#fff", fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 0.6 }}>{t("onbRec").toLocaleUpperCase(s.lang === "tr" ? "tr" : "en")}</Text> : null}
                  {k === 0 ? <BookOne /> : <Compass />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{t(k ? "onbKnowQ" : "onbNewQ")}</Text>
                    <Text style={{ fontFamily: F.body, color: th.muted }}>{t(k ? "onbKnowSub" : "onbNewSub")}</Text>
                  </View>
                </Pressable>); })}
            </View>
          </>}
          {step === 8 && <>
            <View style={{ alignItems: "center", gap: 6, paddingVertical: 30 }}>
              <View style={{ marginBottom: 34 }}><Bubble text={t("onbReady")} center /></View>
              <Animated.View entering={ZoomIn.delay(150).springify().damping(10)}><Juji size={150} /></Animated.View>
            </View>
            <Btn title={t("cont")} onPress={() => finish(undefined, true)} style={{ alignSelf: "stretch" }} />
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

/** Juji asks the question in a speech bubble, the text typed out like Duolingo's owl. */
function Ask({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <Juji size={84} />
      <Bubble text={text} />
    </View>);
}
function Bubble({ text, center }: { text: string; center?: boolean }) {
  const th = useTheme(); const [n, setN] = useState(0);
  useEffect(() => { const id = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(id); return k; } return k + 1; }), 22); return () => clearInterval(id); }, [text]);
  return (
    <View style={{ flex: center ? 0 : 1, maxWidth: 300 }} accessible accessibilityRole="header" accessibilityLabel={text}>
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>
        {/* the full text keeps the size steady while it types out */}
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 18, lineHeight: 24, color: "transparent" }}>{text}</Text>
        <Text style={{ position: "absolute", top: 12, left: 14, right: 14, fontFamily: F.bodyHeavy, fontSize: 18, lineHeight: 24, color: th.ink }}>{text.slice(0, n)}</Text>
      </View>
      <View style={center
        ? { position: "absolute", bottom: -6, alignSelf: "center", width: 12, height: 12, backgroundColor: th.surface, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: th.line2, transform: [{ rotate: "45deg" }] }
        : { position: "absolute", left: -6, top: 20, width: 12, height: 12, backgroundColor: th.surface, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: th.line2, transform: [{ rotate: "45deg" }] }} />
    </View>);
}
function Bars({ n }: { n: number }) {
  const th = useTheme();
  return (
    <Svg width={30} height={24} viewBox="0 0 30 24" importantForAccessibility="no-hide-descendants">
      {[0, 1, 2, 3, 4].map((k) => <Rect key={k} x={k * 6} y={20 - (k + 1) * 4} width={4.2} height={(k + 1) * 4} rx={1.2} fill={k < n ? th.sky : th.line2} />)}
    </Svg>);
}
function BookOne() {
  const th = useTheme();
  return (
    <View style={{ width: 52, height: 60, alignItems: "center", justifyContent: "center" }}>
      <Svg width={46} height={56} viewBox="0 0 46 56">
        <Rect x={3} y={3} width={40} height={50} rx={5} fill={th.zer} />
        <Rect x={3} y={45} width={40} height={8} rx={3} fill="#00000022" />
        <Path d="M10 3 L10 14 L14 11 L18 14 L18 3Z" fill={th.sor} />
      </Svg>
      <Text style={{ position: "absolute", fontFamily: F.display, fontSize: 26, color: "#4a3200" }}>1</Text>
    </View>);
}
function Compass() {
  const th = useTheme();
  return (
    <Svg width={52} height={52} viewBox="0 0 52 52">
      <Circle cx={26} cy={26} r={23} fill={th.surface} stroke={th.sky} strokeWidth={4} />
      <Path d="M26 9 L32 26 L26 26Z" fill={th.sor} /><Path d="M26 9 L20 26 L26 26Z" fill="#e57373" />
      <Path d="M26 43 L20 26 L26 26Z" fill={th.line2} /><Path d="M26 43 L32 26 L26 26Z" fill={th.faint} />
      <Circle cx={26} cy={26} r={2.6} fill={th.ink} />
    </Svg>);
}
