import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { hasAudio, speak, sfx, stopVoice } from "@/lib/audio";
import { NODE, NODES, UNIT, UNITS, WORD } from "@/lib/course";
import { buildEx, genJump, genLearn, genReview, genSent, lev, mean, norm, pick, shuffle, type Ex, type W } from "@/lib/exercises";
import { M, t, tArr, locale } from "@/lib/i18n";
import { addXP, day, dayAdd, getS, learned, markWord, MAXH, update, useS, wordStrength } from "@/lib/store";
import { Juji, KilimRule, Medallion, Sun } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti, Lead, Pic, Sheet, Spk, Title } from "@/ui/kit";
import { WeekDots } from "@/ui/TopBar";
import { F, TS, useTheme } from "@/ui/theme";

type Kind = "learn" | "sent" | "jump" | "weak" | "mistakes" | "listen" | "sprint";
type Info = { pi?: number; ok: boolean; ans?: string; mean?: string | null; ku?: string; typo?: boolean; match?: boolean; slip?: boolean; sentence?: boolean };
type Ans = { val: string | null; get: () => Info };
type Phase = { p: "play" } | { p: "done"; xp: number; acc: number; secs: number; gems: number; goalHit: boolean; streakUp: boolean } | { p: "fail" } | { p: "streak" } | { p: "jumpPass" } | { p: "jumpFail" };

const voiceOn = () => getS().set.voice;
const now = () => Date.now();
const rnd = (n: number) => Math.floor(Math.random() * n);

function build(params: { node?: string; practice?: string; jump?: string }) {
  const v = voiceOn(), s = getS();
  if (params.jump) return { kind: "jump" as Kind, exs: genJump(params.jump, v), id: null as string | null, practice: false, xp: 20 };
  if (params.node) {
    const n = NODE[params.node];
    return { kind: n.type as Kind, exs: n.type === "learn" ? genLearn(n, v, s.words) : genSent(n, v), id: n.id, practice: false, xp: 10 };
  }
  const kind = (params.practice || "weak") as Kind; const lw = learned();
  let ws = kind === "mistakes" ? [...s.mistakes] : [...lw].sort((a, b) => wordStrength(a) - wordStrength(b) || Math.random() - 0.5).slice(0, 8);
  if (ws.length < 4) ws = [...new Set([...ws, ...lw])].slice(0, 8);
  const exs: Ex[] = kind === "sprint" ? [0, 1, 2].map(() => ({ t: "match", pairs: pick(lw.map((k) => WORD[k]) as W[], Math.min(5, lw.length)) }) as Ex) : genReview(ws, v, kind === "listen");
  return { kind, exs, id: null, practice: true, xp: 10 };
}

export default function Lesson() {
  const params = useLocalSearchParams<{ node?: string; practice?: string; jump?: string }>();
  const th = useTheme(); const s = useS(); const ins = useSafeAreaInsets();
  const init = useMemo(() => build(params), []);
  const [queue, setQueue] = useState<Ex[]>(() => init.exs.map((e) => ({ ...e })));
  const total = init.exs.length, graded = init.exs.filter((e) => e.t !== "new").length;
  const [done, setDone] = useState(0);
  const [step, setStep] = useState(0);
  const [verdict, setVerdict] = useState<Info | null>(null);
  const [answer, setAnswer] = useState<Ans | null>(null);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<Phase>(() => (getS().hearts <= 0 && !init.practice && init.kind !== "jump" ? { p: "fail" } : { p: "play" }));
  const [quit, setQuit] = useState(false);
  const Rf = useRef({ combo: 0, best: 0, mistakes: 0, first: 0, t0: 0, wrong: new Set<string>(), tries: new Map<Ex, number>() });
  const [combo, setCombo] = useState(0);
  useEffect(() => { Rf.current.t0 = now(); }, []);
  const e = queue[0];
  const isJump = init.kind === "jump";
  useEffect(() => { if (process.env.EXPO_PUBLIC_E2E) Object.assign(globalThis, { __kewEx: e }); }, [e]);
  useEffect(() => () => stopVoice(), []);

  const loseLife = () => {
    if (init.practice) return;
    if (isJump) { setLives((l) => { const n = l - 1; return n; }); return; }
    update((x) => { x.hearts = Math.max(0, x.hearts - 1); if (x.hearts === MAXH - 1) x.heartAt = Date.now(); });
  };

  const judge = (info: Info) => {
    const R = Rf.current; const ok = info.ok;
    buzz(ok ? "ok" : "bad");
    if (ok) { if (!info.match) sfx("ok"); R.combo++; R.best = Math.max(R.best, R.combo); if (!R.tries.get(e)) R.first++; if (info.ku) markWord(info.ku, true); }
    else { sfx("bad"); R.combo = 0; R.mistakes++; if (info.ku) { markWord(info.ku, false); if (WORD[info.ku]) R.wrong.add(info.ku); } loseLife(); }
    if (ok && R.combo >= 3 && R.combo % 2 === 1) sfx("combo");
    setCombo(R.combo);
    if (info.sentence && ok && info.ku) speak(info.ku);
    setVerdict({ ...info, pi: rnd(20) });
  };

  const next = () => {
    const R = Rf.current; const ex = queue[0]; const ok = ex.t === "new" || verdict?.ok;
    let q = queue.slice(1);
    if (ok) setDone((d) => d + 1);
    else {
      R.tries.set(ex, (R.tries.get(ex) || 0) + 1);
      if (!isJump) q = [...q, ex]; else setDone((d) => d + 1);
      const ku = verdict?.ku; if (ku && WORD[ku]) update((x) => { if (!x.mistakes.includes(ku)) x.mistakes.push(ku); });
    }
    update((x) => { x.daily.bestCombo = Math.max(x.daily.bestCombo, R.best); });
    setVerdict(null); setAnswer(null); setStep((x) => x + 1);
    if (isJump && lives <= 0) return finishJump(false);
    if (!init.practice && !isJump && getS().hearts <= 0) return setPhase({ p: "fail" });
    if (!q.length) return isJump ? finishJump(true) : finish();
    setQueue(q);
  };

  const finish = () => {
    const R = Rf.current; stopVoice();
    const secs = Math.round((now() - R.t0) / 1000), acc = Math.min(100, Math.round((R.first / Math.max(1, graded)) * 100));
    const xp = init.xp + (R.mistakes === 0 ? 5 : 0) + (R.best >= 5 ? 3 : 0); const before = getS().daily.xp;
    const streakUp = addXP(xp);
    let gems = init.practice ? 0 : 5 + (R.mistakes === 0 ? 5 : 0);
    update((x) => {
      x.daily.lessons++; x.stats.lessons++; if (R.mistakes === 0) x.stats.perfect++;
      if (init.id) { if (x.done[init.id]) gems = 0; x.done[init.id] = true; }
      x.gems += gems; if (init.practice) x.hearts = Math.min(MAXH, x.hearts + 1);
      if (init.kind === "mistakes") x.mistakes = x.mistakes.filter((k) => R.wrong.has(k));
    });
    sfx("win"); buzz("win"); confetti();
    setPhase({ p: "done", xp, acc, secs, gems, goalHit: before < getS().goal && getS().daily.xp >= getS().goal, streakUp });
  };
  const finishJump = (pass: boolean) => {
    stopVoice();
    if (!pass) { sfx("bad"); return setPhase({ p: "jumpFail" }); }
    const uid = params.jump!; const idx = NODES.findIndex((n) => n.unit === uid);
    update((x) => {
      NODES.slice(0, idx).forEach((n) => { x.done[n.id] = true; });
      UNITS.slice(0, UNITS.findIndex((u) => u.id === uid)).forEach((u) => u.words.forEach((w) => { if (!x.words[w[0]]) x.words[w[0]] = { s: 2, t: Date.now(), seen: 1 }; }));
      x.stats.jumps++;
    });
    addXP(20); sfx("win"); confetti(); setPhase({ p: "jumpPass" });
  };
  useEffect(() => { if (isJump && lives <= 0 && !verdict) finishJump(false); }, [lives]);

  const close = () => { stopVoice(); router.back(); };

  if (phase.p !== "play") return <ResultView phase={phase} practice={init.practice} kind={init.kind} jumpUnit={params.jump} close={close} setPhase={setPhase} />;
  if (!e) return null;

  const pct = Math.max(4, Math.round((done / total) * 100));
  const locked = !!verdict;
  const heartLabel = init.practice ? "∞" : isJump ? String(lives) : String(s.hearts);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: th.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, height: 56 }}>
          <Pressable onPress={() => setQuit(true)} accessibilityRole="button" accessibilityLabel={t("quitAria")} style={{ width: 44, height: 44, marginLeft: -10, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
          <View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: th.surface2, overflow: "hidden" }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
            <View style={{ width: `${pct}%`, height: "100%", backgroundColor: th.kesk, borderRadius: 7 }}>
              <View style={{ marginTop: 3, marginHorizontal: 6, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.28)" }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }} accessible accessibilityLabel={init.practice ? "∞" : t("heartsAria", { n: heartLabel })}><Icon.heart size={22} color={init.practice ? th.sky : th.sor} /><Text style={{ fontFamily: F.bodyHeavy, fontSize: 17, color: init.practice ? th.skyDeep : th.sorDeep }}>{heartLabel}</Text></View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 18, flexGrow: 1, maxWidth: 560, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={FadeIn.duration(220)} style={{ gap: 18 }}>
            <Exercise e={e} locked={locked} setAnswer={setAnswer} judge={judge} verdict={verdict} lose={loseLife} />
          </Animated.View>
        </ScrollView>
        <Footer e={e} verdict={verdict} answer={answer} combo={combo} onCheck={() => answer && judge(answer.get())} onNext={next} bottom={ins.bottom} />
      </KeyboardAvoidingView>
      <Sheet visible={quit} center onClose={() => setQuit(false)}>
        <View style={{ alignItems: "center" }}><Juji size={110} sad /></View>
        <Text style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink, textAlign: "center" }}>{t("quitQ")}</Text>
        <Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center" }}>{t("quitText")}</Text>
        <Btn title={t("keepGoing")} onPress={() => setQuit(false)} />
        <Pressable onPress={() => { setQuit(false); close(); }} accessibilityRole="button" style={{ alignItems: "center", justifyContent: "center", minHeight: 48, padding: 10 }}><Text style={{ fontFamily: F.bodyHeavy, color: th.sorDeep }}>{t("endLesson")}</Text></Pressable>
      </Sheet>
    </SafeAreaView>
  );
}

/* ================= footer ================= */
function Footer({ e, verdict, answer, combo, onCheck, onNext, bottom }: { e: Ex; verdict: Info | null; answer: Ans | null; combo: number; onCheck: () => void; onNext: () => void; bottom: number }) {
  const th = useTheme();
  if (e.t === "new") return <View style={{ padding: 16, paddingBottom: 16 + bottom, borderTopWidth: 1, borderColor: th.line }}><Btn title={t("cont")} onPress={onNext} /></View>;
  if (!verdict) {
    if (e.t === "match") return <View style={{ padding: 16, paddingBottom: 22 + bottom, borderTopWidth: 1, borderColor: th.line }}><Text style={{ textAlign: "center", fontFamily: F.italic, fontSize: TS.md, color: th.muted }}>{t("matchHint")}</Text></View>;
    return <View style={{ padding: 16, paddingBottom: 16 + bottom, borderTopWidth: 1, borderColor: th.line }}><Btn title={t("check")} disabled={!answer?.val} onPress={onCheck} /></View>;
  }
  const ok = verdict.ok; const pr = tArr("praise");
  const title = ok ? (verdict.typo ? t("typo") : pr[(verdict.pi ?? 0) % pr.length]) : t("correctIs");
  const showCombo = ok && combo >= 3 && combo % 2 === 1;
  return (
    <Animated.View entering={SlideInDown.duration(220)} accessibilityLiveRegion="polite"
      style={{ padding: 16, paddingTop: 0, paddingBottom: 16 + bottom, gap: 12, backgroundColor: ok ? th.keskSoft : th.sorSoft }}>
      <KilimRule color={ok ? th.kesk : th.sor} h={10} lines={false} seed={(verdict.pi ?? 0) + (ok ? 1 : 50)} style={{ marginTop: 8, opacity: 0.6 }} />
      {showCombo && <Text style={{ fontFamily: F.italicBold, fontSize: TS.md, color: th.zerDeep }}>{t("combo", { n: combo })}</Text>}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 30, height: 30, borderRadius: 7, transform: [{ rotate: "45deg" }], backgroundColor: ok ? th.kesk : th.sor }} />
          <View>{ok ? <Icon.check size={22} /> : <Icon.x size={18} color="#fff" />}</View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.display, fontSize: TS.xl - 2, lineHeight: 28, color: ok ? th.keskDeep : th.sorDeep }}>{title}</Text>
          {verdict.match ? (verdict.slip ? <Text style={{ fontFamily: F.body, color: th.ink }}>{t("fewTries")}</Text> : null)
            : (!ok || verdict.typo) ? <Text style={{ fontFamily: F.serif, color: th.ink, fontSize: TS.lg }}>{verdict.ans}</Text> : null}
          {verdict.mean && !verdict.match ? <Text style={{ fontFamily: F.body, color: th.muted }}>{ok ? `${verdict.ans} = ${verdict.mean}` : verdict.mean}</Text> : null}
        </View>
        {verdict.ku && hasAudio(verdict.ku) ? <Spk text={verdict.ku} size={40} /> : null}
      </View>
      <Btn title={t("cont")} kind={ok ? "primary" : "bad"} onPress={onNext} />
    </Animated.View>
  );
}

/* ================= exercises ================= */
type Common = { locked: boolean; verdict: Info | null; setAnswer: (a: Ans | null) => void; judge: (i: Info) => void; lose: () => void };
type ExP = Common & { e: Ex };
type P<K extends Ex["t"]> = Common & { e: Extract<Ex, { t: K }> };

function Kind({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  const th = useTheme();
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -6 }}>{icon}<Text style={{ fontFamily: F.italicBold, fontSize: TS.md, color: color ?? th.keskDeep }}>{label}</Text></View>;
}
function Q({ children }: { children: React.ReactNode }) { const th = useTheme(); return <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: 29, lineHeight: 34, color: th.ink, letterSpacing: -0.2 }}>{children}</Text>; }

function JujiSays({ text, voice = true }: { text: string; voice?: boolean }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
      <Juji size={96} />
      <View style={{ flex: 1, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>
          {voice && hasAudio(text) ? <Spk text={text} size={40} /> : null}
          <Text style={{ flex: 1, fontFamily: voice ? F.serif : F.bodyHeavy, fontSize: voice ? 22 : 19, lineHeight: voice ? 27 : 25, color: th.ink }}>{text}</Text>
        </View>
        {/* speech-bubble tail pointing at Juji */}
        <View style={{ position: "absolute", left: -6, bottom: 10, width: 12, height: 12, backgroundColor: th.surface, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: th.line2, transform: [{ rotate: "45deg" }] }} />
      </View>
    </View>
  );
}

function Opt({ label, idx, state, onPress, ku }: { label: string; idx: number; state: "" | "sel" | "right" | "wrong"; onPress: () => void; ku?: boolean }) {
  const th = useTheme();
  const bc = state === "sel" ? th.sky : state === "right" ? th.kesk : state === "wrong" ? th.sor : th.line2;
  const tc = state === "sel" ? th.skyDeep : state === "right" ? th.keskDeep : state === "wrong" ? th.sorDeep : th.muted;
  const bg = state === "sel" ? th.skySoft : state === "right" ? th.keskSoft : state === "wrong" ? th.sorSoft : th.surface;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: state === "sel" }}
      style={({ pressed }) => ({ minHeight: 58, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: state ? 2 : 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: bc, backgroundColor: bg })}>
      <Text style={{ width: 26, height: 26, lineHeight: 23, textAlign: "center", borderRadius: 6, borderWidth: 1.5, borderColor: state ? bc : th.line2, color: tc, fontFamily: F.bodyHeavy, fontSize: 13 }}>{idx + 1}</Text>
      <Text style={{ flex: 1, fontFamily: ku ? F.serif : F.bodySemi, fontSize: ku ? 21 : 18, lineHeight: 26, color: th.ink }}>{label}</Text>
    </Pressable>
  );
}

function Exercise(p: ExP) {
  const { e, ...c } = p;
  switch (e.t) {
    case "new": return <NewWord w={e.w} />;
    case "mc": case "mcr": case "listen": return <Choice {...c} e={e} />;
    case "pic": return <PicEx {...c} e={e} />;
    case "match": return <Match {...c} e={e} />;
    case "build": return <Build {...c} e={e} />;
    case "fill": return <Fill {...c} e={e} />;
    default: return <TypeEx {...c} e={e} />;
  }
}

function NewWord({ w }: { w: W }) {
  const th = useTheme();
  useEffect(() => { const tm = setTimeout(() => speak(w.ku), 250); markWord(w.ku, true); return () => clearTimeout(tm); }, [w.ku]);
  return (<>
    <Kind icon={<Icon.star size={18} color={th.zerDeep} />} label={t("newWord")} color={th.zerDeep} />
    <Animated.View entering={FadeInDown.duration(300)} style={{ alignItems: "center", gap: 12, padding: 24, paddingTop: 18, borderRadius: 18, borderTopLeftRadius: 4, borderWidth: 1.5, borderBottomWidth: 5, borderColor: th.line2, backgroundColor: th.surface }}>
      <KilimRule color={th.zer} accent={th.sor} h={10} seed={w.ku.length * 7} style={{ marginBottom: 6 }} />
      <Pic p={w.pic} size={84} />
      <Text style={{ fontFamily: F.display, fontSize: 46, lineHeight: 52, color: th.ink, textAlign: "center" }}>{w.ku}</Text>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 19, color: th.muted, textAlign: "center" }}>{mean(w)}</Text>
      {hasAudio(w.ku) ? <View style={{ flexDirection: "row", gap: 12 }}><Spk text={w.ku} size={52} /><Spk text={w.ku} slow size={52} /></View> : null}
    </Animated.View>
  </>);
}

function Choice({ e, locked, verdict, setAnswer }: P<"mc" | "mcr" | "listen">) {
  const th = useTheme();
  const w = e.w, correct = e.t === "mcr" ? mean(w) : w.ku; const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { if (e.t !== "mc") { const tm = setTimeout(() => speak(w.ku), 300); return () => clearTimeout(tm); } }, []);
  useEffect(() => { setAnswer({ val: sel, get: () => ({ ok: norm(sel!) === norm(correct), ans: correct, mean: e.t === "mcr" ? null : mean(w), ku: w.ku }) }); }, [sel]);
  return (<>
    {e.t === "mc" && <><Kind icon={<Icon.chat size={18} color={th.keskDeep} />} label={t("howSay")} /><Q>{t("howSayQ", { w: mean(w) })}</Q></>}
    {e.t === "mcr" && <><Kind icon={<Icon.chat size={18} color={th.keskDeep} />} label={t("whatMeans")} /><JujiSays text={w.ku} /></>}
    {e.t === "listen" && <><Kind icon={<Icon.ear size={18} color={th.keskDeep} />} label={t("hearSelect")} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, paddingVertical: 10 }}><Spk text={w.ku} size={84} /><Spk text={w.ku} slow size={60} /></View></>}
    <View style={{ gap: 10 }}>
      {e.opts.map((o, i) => {
        const st = verdict ? (norm(o) === norm(correct) ? "right" : o === sel ? "wrong" : "") : o === sel ? "sel" : "";
        return <Opt key={o} label={o} idx={i} ku={e.t !== "mcr"} state={st} onPress={() => { if (locked) return; sfx("tap"); buzz("select"); setSel(o); if (e.t === "mc") speak(o); }} />;
      })}
    </View>
  </>);
}

function PicEx({ e, locked, verdict, setAnswer }: P<"pic">) {
  const th = useTheme(); const w = e.w; const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { const tm = setTimeout(() => speak(w.ku), 300); return () => clearTimeout(tm); }, []);
  useEffect(() => { setAnswer({ val: sel, get: () => ({ ok: sel === w.ku, ans: w.ku, mean: mean(w), ku: w.ku }) }); }, [sel]);
  return (<>
    <Kind icon={<Icon.star size={18} color={th.keskDeep} />} label={t("pickPic")} />
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Q>{t("whichIs", { w: w.ku })}</Q>{hasAudio(w.ku) ? <Spk text={w.ku} size={40} /> : null}</View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {e.cards.map((c) => {
        const st = verdict ? (c.ku === w.ku ? "right" : c.ku === sel ? "wrong" : "") : c.ku === sel ? "sel" : "";
        const bc = st === "sel" ? th.sky : st === "right" ? th.kesk : st === "wrong" ? th.sor : th.line2;
        return (
          <Pressable key={c.ku} onPress={() => { if (locked) return; sfx("tap"); setSel(c.ku); }} accessibilityRole="button"
            accessibilityLabel={verdict ? c.ku : undefined}
            style={{ width: "47%", aspectRatio: 1, alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: st ? 2 : 1.5, borderBottomWidth: 4, borderColor: bc, backgroundColor: st === "sel" ? th.skySoft : st === "right" ? th.keskSoft : st === "wrong" ? th.sorSoft : th.surface }}>
            <Pic p={c.pic} size={70} />
            <Text style={{ fontFamily: F.serif, fontSize: TS.lg, color: th.ink, opacity: verdict ? 1 : 0 }}>{c.ku}</Text>
          </Pressable>);
      })}
    </View>
  </>);
}

function Match({ e, locked, judge, lose }: P<"match">) {
  const th = useTheme();
  const pairs = useMemo(() => { const um = new Set<string>(); return e.pairs.filter((w) => { const k = norm(mean(w)); if (um.has(k)) return false; um.add(k); return true; }); }, []);
  const L = useMemo(() => shuffle(pairs), []), Rr = useMemo(() => shuffle(pairs), []);
  const [sel, setSel] = useState<{ side: "l" | "r"; k: string } | null>(null);
  const [okSet, setOk] = useState<Set<string>>(new Set()); const [bad, setBad] = useState<string[]>([]); const slip = useRef(false);
  const tap = (side: "l" | "r", k: string) => {
    if (locked || okSet.has(k)) return;
    if (side === "l") speak(k);
    if (!sel || sel.side === side) { sfx("tap"); setSel({ side, k }); return; }
    if (sel.k === k) {
      sfx("ok"); markWord(k, true); const n = new Set(okSet); n.add(k); setOk(n); setSel(null);
      if (n.size === pairs.length) setTimeout(() => judge({ ok: true, match: true, slip: slip.current }), 350);
    } else {
      sfx("bad"); slip.current = true; setBad([sel.side + sel.k, side + k]); setTimeout(() => setBad([]), 420); setSel(null);
      markWord(sel.side === "l" ? sel.k : k, false);
      lose();
    }
  };
  const Tile = ({ side, w }: { side: "l" | "r"; w: W }) => {
    const done = okSet.has(w.ku), isSel = sel?.side === side && sel.k === w.ku, isBad = bad.includes(side + w.ku);
    return (
      <Pressable onPress={() => tap(side, w.ku)} disabled={done} accessibilityRole="button"
        accessibilityState={{ selected: isSel, disabled: done }}
        style={{ minHeight: 56, justifyContent: "center", alignItems: "center", padding: 10, borderRadius: 12, borderTopLeftRadius: 4, borderWidth: isBad || isSel ? 2 : 1.5, borderBottomWidth: 4, opacity: done ? 0.35 : 1,
          borderColor: isBad ? th.sor : isSel ? th.sky : th.line2, backgroundColor: isBad ? th.sorSoft : isSel ? th.skySoft : th.surface }}>
        <Text style={{ fontFamily: side === "l" ? F.serif : F.bodySemi, fontSize: side === "l" ? 19 : 16, color: th.ink, textAlign: "center" }}>{side === "l" ? w.ku : mean(w)}</Text>
      </Pressable>);
  };
  return (<>
    <Kind icon={<Icon.bolt size={18} color={th.keskDeep} />} label={t("match")} />
    <Q>{t("matchQ")}</Q>
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ flex: 1, gap: 10 }}>{L.map((w) => <Tile key={w.ku} side="l" w={w} />)}</View>
      <View style={{ flex: 1, gap: 10 }}>{Rr.map((w) => <Tile key={w.ku} side="r" w={w} />)}</View>
    </View>
  </>);
}

function Build({ e, locked, setAnswer }: P<"build">) {
  const th = useTheme();
  const toks = useMemo(() => e.toks.map((tk, i) => ({ tk, i })), []); const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => { if (e.rev) { const tm = setTimeout(() => speak(e.prompt), 300); return () => clearTimeout(tm); } }, []);
  useEffect(() => { const str = picked.map((i) => toks[i].tk).join(" "); setAnswer({ val: picked.length ? str : null, get: () => ({ ok: norm(str) === norm(e.ans), ans: e.ans, ku: e.say, sentence: true }) }); }, [picked]);
  const Chip = ({ i, onPress, ghost }: { i: number; onPress: () => void; ghost?: boolean }) => (
    <Pressable onPress={onPress} disabled={ghost || locked} accessibilityRole="button" accessibilityLabel={toks[i].tk} style={{ minHeight: 46, justifyContent: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderTopLeftRadius: 3, borderWidth: 1.5, borderBottomWidth: ghost ? 1.5 : 4, borderColor: ghost ? th.line : th.line2, backgroundColor: ghost ? th.surface2 : th.surface }}>
      <Text style={{ fontFamily: e.rev ? F.bodySemi : F.serif, fontSize: e.rev ? 17 : 20, color: ghost ? "transparent" : th.ink }}>{toks[i].tk}</Text>
    </Pressable>);
  return (<>
    <Kind icon={<Icon.chat size={18} color={th.keskDeep} />} label={e.rev ? t("toBase") : t("toKu")} />
    <JujiSays text={e.prompt} voice={!!e.rev} />
    <View style={{ minHeight: 120, flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 8, paddingVertical: 10, backgroundColor: "transparent" }}>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 62, height: 1.5, backgroundColor: th.line2 }} />
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 2, height: 1.5, backgroundColor: th.line2 }} />
      {picked.map((i) => <Chip key={i} i={i} onPress={() => setPicked((p) => p.filter((x) => x !== i))} />)}
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
      {toks.map(({ i }) => <Chip key={i} i={i} ghost={picked.includes(i)} onPress={() => { sfx("tap"); if (!e.rev) speak(toks[i].tk); setPicked((p) => [...p, i]); }} />)}
    </View>
  </>);
}

function Fill({ e, locked, verdict, setAnswer }: P<"fill">) {
  const th = useTheme(); const [sel, setSel] = useState<string | null>(null);
  const toks = e.s[0].split(" ");
  useEffect(() => { setAnswer({ val: sel, get: () => ({ ok: norm(sel!) === norm(e.ans), ans: e.s[0], ku: e.s[0], sentence: true }) }); }, [sel]);
  return (<>
    <Kind icon={<Icon.chat size={18} color={th.keskDeep} />} label={t("fill")} />
    <Text style={{ fontFamily: F.bodySemi, fontSize: 18, color: th.muted }}>{M(e.s[1])}</Text>
    <Text style={{ fontFamily: F.serif, fontSize: 27, lineHeight: 38, color: th.ink }}>
      {toks.map((tk, j) => j === e.j ? <Text key={j} style={{ color: th.skyDeep, textDecorationLine: "underline" }}>{(sel ?? "_____") + (/[.,!?]$/.test(tk) ? tk.slice(-1) : "")} </Text> : tk + " ")}
    </Text>
    <View style={{ gap: 10 }}>
      {e.opts.map((o, i) => { const st = verdict ? (norm(o) === norm(e.ans) ? "right" : o === sel ? "wrong" : "") : o === sel ? "sel" : "";
        return <Opt key={o} label={o} idx={i} ku state={st} onPress={() => { if (locked) return; sfx("tap"); buzz("select"); setSel(o); }} />; })}
    </View>
  </>);
}

function TypeEx({ e, locked, setAnswer }: P<"type">) {
  const th = useTheme(); const w = e.w; const [v, setV] = useState("");
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null);
  useEffect(() => { const tm = setTimeout(() => speak(w.ku), 300); return () => clearTimeout(tm); }, []);
  useEffect(() => { setAnswer({ val: v.trim() ? v : null, get: () => { const a = norm(v), b = norm(w.ku), d = lev(a, b), ok = d === 0 || (d === 1 && b.length > 4); return { ok, ans: w.ku, mean: mean(w), ku: w.ku, typo: ok && d === 1 }; } }); }, [v]);
  return (<>
    <Kind icon={<Icon.ear size={18} color={th.keskDeep} />} label={t("hearType")} />
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, paddingVertical: 6 }}><Spk text={w.ku} size={76} /><Spk text={w.ku} slow size={56} /></View>
    <TextInput ref={ref} value={v} onChangeText={setV} editable={!locked} placeholder={t("typePh")} placeholderTextColor={th.faint} autoCapitalize="none" autoCorrect={false} spellCheck={false} multiline
      accessibilityLabel={t("answer")} style={{ minHeight: 110, padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface, color: th.ink, fontFamily: F.serif, fontSize: 22, textAlignVertical: "top" }} />
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
      {["ê", "î", "û", "ç", "ş"].map((k) => <Pressable key={k} onPress={() => { buzz("select"); setV((x) => x + k); ref.current?.focus(); }} accessibilityRole="button" accessibilityLabel={k} style={{ width: 48, height: 48, borderRadius: 10, borderWidth: 1.5, borderBottomWidth: 4, borderColor: th.line2, backgroundColor: th.surface, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: F.serif, fontSize: 22, color: th.ink }}>{k}</Text></Pressable>)}
    </View>
  </>);
}

/* ================= results ================= */
function CountUp({ to, prefix = "", suffix = "", style }: { to: number; prefix?: string; suffix?: string; style: object }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t0 = Date.now(); const id = setInterval(() => { const p = Math.min(1, (Date.now() - t0) / 700); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p >= 1) clearInterval(id); }, 30); return () => clearInterval(id); }, [to]);
  return <Text style={style}>{prefix}{n}{suffix}</Text>;
}

function ResultView({ phase, practice, kind, jumpUnit, close, setPhase }: { phase: Phase; practice: boolean; kind: Kind; jumpUnit?: string; close: () => void; setPhase: (p: Phase) => void }) {
  const th = useTheme(); const s = useS();
  const wrap = (children: React.ReactNode) => (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 22, gap: 18, maxWidth: 520, width: "100%", alignSelf: "center" }}>{children}</ScrollView>
    </SafeAreaView>);

  if (phase.p === "fail") return wrap(<>
    <Juji size={140} sad /><Title>{t("failTitle")}</Title><Lead>{t("failText")}</Lead>
    <Btn title={t("practiceHeart")} kind="sky" onPress={() => router.replace({ pathname: "/lesson", params: { practice: "weak" } })} style={{ alignSelf: "stretch" }} />
    <Btn title={t("home")} kind="ghost" onPress={close} style={{ alignSelf: "stretch" }} />
  </>);
  if (phase.p === "jumpFail") return wrap(<><Juji size={140} sad /><Title>{t("jumpFail")}</Title><Lead>{t("jumpFailText")}</Lead><Btn title={t("home")} onPress={close} style={{ alignSelf: "stretch" }} /></>);
  if (phase.p === "jumpPass") return wrap(<><Juji size={140} /><Title>{t("jumpPass")}</Title><Lead>{t("jumpPassText", { u: UNIT[jumpUnit!].ku })}</Lead><Btn title={t("contOn")} onPress={close} style={{ alignSelf: "stretch" }} /></>);
  if (phase.p === "streak") {
    const days = [...Array(7)].map((_, i) => dayAdd(day(), i - 6));
    return wrap(<>
      <View style={{ alignItems: "center" }}><Icon.fire size={120} color={th.fire} /><Text style={{ fontFamily: F.display, fontSize: 48, color: th.fire, marginTop: -10 }}>{s.streak}</Text></View>
      <Title color={th.fire}>{t("streakUp", { n: s.streak })}</Title><Lead>{t("streakUpText")}</Lead>
      <View style={{ alignSelf: "stretch" }}><WeekDots days={days} xpLog={s.xpLog} /></View>
      <Btn title={t("contOn")} onPress={close} style={{ alignSelf: "stretch" }} />
    </>);
  }
  if (phase.p !== "done") return null;
  const secs = phase.secs;
  const tile = (label: string, c: string, value: React.ReactNode) => (
    <View style={{ flex: 1, paddingVertical: 12, alignItems: "center", gap: 2, borderTopWidth: 3, borderColor: c }} accessible>
      <Text style={{ color: th.muted, textAlign: "center", fontFamily: F.bodyHeavy, fontSize: 12 }}>{label}</Text>
      {value}
    </View>);
  const big = { fontFamily: F.display, fontSize: 30 };
  const pctPre = locale() === "tr" ? "%" : "", pctSuf = locale() === "tr" ? "" : "%";
  return wrap(<>
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Medallion size={170} color={th.zer} accent={th.sor} core={false} />
      <View style={{ position: "absolute" }}><Sun size={74} color={th.zer} /></View>
    </View>
    <Title>{practice ? t("practiceDone") : phase.acc === 100 ? t("perfect") : t("lessonDone")}</Title>
    <Lead>{(phase.goalHit ? t("goalHit") + " " : "") + (practice ? t("heartWon") : phase.gems ? t("gemsEarned", { n: phase.gems }) : "")}</Lead>
    <View style={{ flexDirection: "row", gap: 10, alignSelf: "stretch" }}>
      {tile(t("totalXp"), th.zer, <CountUp to={phase.xp} prefix="+" style={{ ...big, color: th.zerDeep }} />)}
      {tile(t("accuracy"), th.kesk, <CountUp to={phase.acc} prefix={pctPre} suffix={pctSuf} style={{ ...big, color: th.keskDeep }} />)}
      {tile(t("time"), th.sky, <Text style={{ ...big, color: th.skyDeep }}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</Text>)}
    </View>
    <Btn title={t("contOn")} onPress={() => { if (phase.streakUp) { sfx("fire"); setPhase({ p: "streak" }); } else close(); }} style={{ alignSelf: "stretch" }} />
  </>);
}
