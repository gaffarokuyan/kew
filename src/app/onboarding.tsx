import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, ZoomIn } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { courseId, coursesFor, LEVELS, levelFirstUnit, NODES, UNITS, type CourseId, type Level } from "@/lib/course";
import { LANGS, M, t, t2, tArr } from "@/lib/i18n";
import { askReminder, scheduleReminders } from "@/lib/remind";
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

/** «Neden öğreniyorsun?» — reasons per course; the answer personalises Juji's lines. */
const WHY_KU = ["roots", "culture", "travel", "people", "school", "brain"] as const;
const WHY_EN = ["travel", "culture", "school", "work", "people", "brain"] as const;
const WHY_ICON: Record<string, string> = { roots: "🏡", culture: "🎶", travel: "✈️", people: "💞", school: "🎓", work: "💼", brain: "🧠" };
/** First-launch interface language from the device, so the welcome screen already speaks it. */
function deviceLang(): Lang {
  try { const l = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase(); return l.startsWith("de") ? "de" : l.startsWith("en") ? "en" : "tr"; } catch { return "tr"; }
}

export default function Onboarding() {
  const th = useTheme(); const s = useS();
  const [step, setStep] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
  useEffect(() => { if (!s.lang) update((x) => { x.lang = deviceLang(); }); }, []);
  const jt = jumpTarget(s.level);
  const finish = (jump?: string, firstLesson?: boolean) => {
    update((x) => { x.onboard = true; });
    router.replace("/(tabs)");
    if (jump) setTimeout(() => router.push({ pathname: "/lesson", params: { jump } }), 350);
    else if (firstLesson && NODES[0]) setTimeout(() => router.push({ pathname: "/lesson", params: { node: NODES[0].id } }), 350);
    else if (s.level > 0) setTimeout(() => toast(t("heritageHint")), 700);
  };
  const native = Platform.OS !== "web";
  const afterGoal = () => setStep(native && !s.remind ? 10 : jt ? 7 : 8);
  const afterRemind = () => setStep(jt ? 7 : 8);
  const goals = [10, 20, 30, 50], mins = [5, 10, 15, 20];
  const whys = courseId() === "eng" ? WHY_EN : WHY_KU;
  const choice = (on: boolean) => ({ pressed }: { pressed: boolean }) => ({
    minHeight: 64, flexDirection: "row" as const, gap: 14, alignItems: "center" as const, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderTopLeftRadius: 4,
    backgroundColor: on ? th.skySoft : th.surface, borderWidth: on ? 2 : 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: on ? th.sky : th.line2,
  });
  const tap = () => { sfx("tap"); buzz("select"); };
  const back = step === 0 ? null : step === 5 ? 0 : step === 6 ? 5 : step === 9 ? (courseId() === "ckb" ? 6 : 5) : step === 2 ? 9 : step === 3 ? 2 : step === 10 ? 3 : step === 7 ? (native && !s.remind ? 10 : 3) : step === 8 ? (jt ? 7 : 3) : step === 4 ? 7 : null;
  const prog = [0, 5, 6, 9, 2, 3, 10, 7, 8, 4].indexOf(step) / 9;
  const curLang = LANGS.find(([c]) => c === s.lang) ?? LANGS[0];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: step === 0 ? th.panel : th.bg }}>
      {step > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, height: 52, maxWidth: 520, width: "100%", alignSelf: "center" }}>
          <Pressable onPress={() => back != null && setStep(back)} accessibilityRole="button" accessibilityLabel={t("back")} hitSlop={8} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 24, color: th.muted }}>←</Text>
          </Pressable>
          <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: th.line, overflow: "hidden" }}>
            <Animated.View style={{ width: `${Math.max(6, prog * 100)}%`, height: "100%", borderRadius: 6, backgroundColor: th.kesk }} />
          </View>
        </View>) : null}
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: step === 0 ? "space-between" : "center", padding: 24, gap: 18 }}>
        {step === 0 && <>
          {/* top-right: interface language */}
          <View style={{ alignItems: "flex-end", zIndex: 10 }}>
            <Pressable onPress={() => { tap(); setLangOpen((o) => !o); }} accessibilityRole="button" accessibilityLabel={`${t("uiLang")}: ${curLang[1]}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(246,240,228,0.35)" }}>
              <Text style={{ fontSize: 16 }}>🌐</Text>
              <Text style={{ fontFamily: F.bodyHeavy, fontSize: 14, color: th.panelInk }}>{String(curLang[0]).toUpperCase()}</Text>
            </Pressable>
            {langOpen ? (
              <Animated.View entering={FadeInDown.duration(160)} style={{ position: "absolute", top: 46, right: 0, minWidth: 180, padding: 6, borderRadius: 14, backgroundColor: th.surface, borderWidth: 1.5, borderColor: th.line2, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
                {LANGS.map(([c, n, sub]) => (
                  <Pressable key={c} onPress={() => { tap(); update((x) => { x.lang = c as Lang; }); if (!coursesFor(c).some((k) => k.id === courseId())) switchCourse("kmr"); setLangOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: s.lang === c }}
                    style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: s.lang === c ? th.skySoft : "transparent" }}>
                    <Text style={{ fontFamily: F.bodyHeavy, fontSize: 16, color: th.ink }}>{n}</Text>
                    <Text style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{sub}</Text>
                  </Pressable>))}
              </Animated.View>) : null}
          </View>
          <View style={{ alignItems: "center", gap: 10 }}>
            <Floaters />
            <Animated.View entering={ZoomIn.springify().damping(11)}><Juji size={190} /></Animated.View>
            <Text accessibilityRole="header" style={{ fontFamily: F.italicBold, fontSize: 64, lineHeight: 70, color: th.panelInk, letterSpacing: -1 }}>Juji</Text>
            <KilimRule color={th.zer} accent={th.sor} h={12} seed={2} style={{ width: 200 }} />
            <Text style={{ fontFamily: F.display, fontSize: 26, lineHeight: 32, color: th.panelInk, textAlign: "center", maxWidth: 320 }}>{t("welcomeTag")}</Text>
            <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 22, color: "rgba(246,240,228,0.8)", textAlign: "center", maxWidth: 320 }}>{t("welcomeSub")}</Text>
          </View>
          <View style={{ gap: 12, width: "100%", maxWidth: 440, alignSelf: "center" }}>
            <Btn title={t("welcomeStart")} onPress={() => { tap(); setStep(5); }} />
            <Pressable onPress={() => toast(t("loginSoon"))} accessibilityRole="button" style={{ alignSelf: "center", paddingVertical: 10 }}>
              <Text style={{ fontFamily: F.body, fontSize: TS.md, color: "rgba(246,240,228,0.85)" }}>{t("haveAccount")} <Text style={{ fontFamily: F.bodyHeavy, color: th.zer }}>{t("signIn")}</Text></Text>
            </Pressable>
          </View>
        </>}
        {step > 0 && <Animated.View key={step} entering={FadeInDown.duration(320)} style={{ width: "100%", maxWidth: 440, alignSelf: "center", gap: 18 }}>
          {step === 5 && <>
            <Ask text={t("onbCourse")} />
            <View style={{ width: "100%", gap: 10 }}>
              {coursesFor(s.lang).map((c) => { const smp = COURSE_SAMPLE[c.id]; const on = courseId() === c.id; return (
                <Pressable key={c.id} onPress={() => { tap(); switchCourse(c.id); setStep(c.id === "ckb" ? 6 : 9); }} accessibilityRole="button" accessibilityLabel={`${c.name}. ${M(c.sub)}`} style={choice(on)}>
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
            <Lead align="left">{t("onbCourseText")}</Lead>
          </>}
          {step === 6 && <ScriptOptions onPick={(m) => { tap(); setCkbScript(m); setStep(9); }} />}
          {step === 9 && <>
            <Ask text={t("onbWhy")} />
            <View style={{ width: "100%", gap: 10 }}>
              {whys.map((k) => { const on = s.why === k; return (
                <Pressable key={k} onPress={() => { tap(); update((x) => { x.why = k; }); setTimeout(() => setStep(2), 180); }} accessibilityRole="button" accessibilityState={{ selected: on }} style={choice(on)}>
                  <Text style={{ fontSize: 26 }}>{WHY_ICON[k]}</Text>
                  <Text style={{ flex: 1, fontFamily: F.bodyHeavy, fontSize: 17, color: th.ink }}>{t(courseId() === "eng" ? `whyEn_${k}` : `why_${k}`)}</Text>
                </Pressable>); })}
            </View>
          </>}
          {step === 2 && <>
            <Ask key="lvl" text={t("onbLevel")} />
            <View style={{ width: "100%", gap: 10 }}>
              {LEVEL_CHOICES.map((i) => { const [a, b] = t2("lvl" + i); return (
                <Pressable key={i} onPress={() => { tap(); update((x) => { x.level = i; }); setStep(3); }} accessibilityRole="button" accessibilityLabel={`${a}. ${b}`} style={choice(s.level === i)}>
                  <Bars n={i + 1} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{a}</Text>
                    <Text style={{ fontFamily: F.body, color: th.muted }}>{b}</Text>
                  </View>
                </Pressable>); })}
            </View>
          </>}
          {step === 3 && <>
            <Ask text={t("onbGoal")} />
            <View style={{ width: "100%", borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface, overflow: "hidden" }}>
              {goals.map((g, i) => { const on = s.goal === g; return (
                <Pressable key={g} onPress={() => { tap(); update((x) => { x.goal = g; }); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderColor: th.line, backgroundColor: on ? th.skySoft : "transparent" }}>
                  <Text style={{ flex: 1, fontFamily: F.bodyHeavy, fontSize: 17, color: on ? th.skyDeep : th.ink }}>{t("minDay", { n: mins[i] })}</Text>
                  <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: on ? th.skyDeep : th.muted }}>{tArr("goals")[i]}</Text>
                </Pressable>); })}
            </View>
            <Lead align="left">{t("onbGoalText")}</Lead>
            <Btn title={t("setGoal")} onPress={afterGoal} style={{ alignSelf: "stretch" }} />
          </>}
          {step === 10 && <>
            <View style={{ alignItems: "center", gap: 14, paddingVertical: 10 }}>
              <Target />
              <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: 26, lineHeight: 32, color: th.ink, textAlign: "center" }}>{t("onbRemTitle")}</Text>
              <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 22, color: th.muted, textAlign: "center" }}>{t("onbRemSub")}</Text>
            </View>
            <Btn title={t("onbRemOn")} kind="sky" onPress={async () => { const ok = await askReminder(); update((x) => { x.remind = { on: ok, h: 19, m: 0 }; }); scheduleReminders(); afterRemind(); }} style={{ alignSelf: "stretch" }} />
            <Btn title={t("onbRemLater")} kind="ghost" onPress={() => { update((x) => { x.remind = { on: false, h: 19, m: 0 }; }); afterRemind(); }} style={{ alignSelf: "stretch" }} />
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
              <View style={{ marginBottom: 34 }}><Bubble text={t("onbReady") + (s.why ? "\n" + t("whyR_" + s.why) : "")} center /></View>
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
        </Animated.View>}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Kilim diamonds drifting around Juji on the welcome screen. */
function Floaters() {
  const th = useTheme();
  const items = [{ x: -130, y: 20, c: th.zer, s: 18, d: 0 }, { x: 120, y: 0, c: th.sor, s: 14, d: 300 }, { x: -100, y: 150, c: th.sky, s: 12, d: 600 }, { x: 135, y: 130, c: th.kesk, s: 20, d: 150 }, { x: 0, y: -16, c: th.zer, s: 10, d: 450 }];
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, alignItems: "center" }}>
      {items.map((it, i) => <Drift key={i} {...it} />)}
    </View>);
}
function Drift({ x, y, c, s, d }: { x: number; y: number; c: string; s: number; d: number }) {
  const v = useSharedValue(0);
  useEffect(() => { v.value = withDelay(d, withRepeat(withSequence(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })), -1)); }, [v, d]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x }, { translateY: y - v.value * 10 }, { rotate: `${45 + v.value * 20}deg` }], opacity: 0.55 + v.value * 0.35 }));
  return <Animated.View style={[{ position: "absolute", top: 0, width: s, height: s, borderRadius: 3, borderWidth: 2.5, borderColor: c }, st]} />;
}
function Target() {
  const th = useTheme();
  return (
    <Svg width={130} height={130} viewBox="0 0 130 130">
      <Circle cx={60} cy={70} r={52} fill={th.sor} /><Circle cx={60} cy={70} r={39} fill="#fff" /><Circle cx={60} cy={70} r={27} fill={th.sor} /><Circle cx={60} cy={70} r={14} fill="#fff" /><Circle cx={60} cy={70} r={6} fill={th.sor} />
      <Path d="M62 68 L112 18" stroke={th.ink} strokeWidth={4} strokeLinecap="round" />
      <Path d="M104 12 L118 10 L116 24 Z" fill={th.zer} /><Path d="M108 26 L122 24" stroke={th.zer} strokeWidth={4} strokeLinecap="round" />
    </Svg>);
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
