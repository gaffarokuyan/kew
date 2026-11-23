import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import data from "@/content/alpha.json";
import { sfx } from "@/lib/audio";
import { pick, shuffle } from "@/lib/exercises";
import { M, t } from "@/lib/i18n";
import { addXP } from "@/lib/store";
import { KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti, H2, Meter } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

type L = { ch: string; lat: string; joins: boolean; note: string; ex: string | null; exLat: string | null; exM: string | null };
const LETTERS = data.letters as L[];
const READ = data.read as [string, string][];
const ZWJ = "‍";
/** isolated, final, medial, initial — joining letters have four shapes, the others two */
const forms = (l: L) => l.ch.length > 1 ? [l.ch] : l.joins ? [l.ch, ZWJ + l.ch, ZWJ + l.ch + ZWJ, l.ch + ZWJ] : [l.ch, ZWJ + l.ch];
type Q = { prompt: string; small?: string; opts: string[]; ans: string; rtl: boolean; explain: string };

function makeQuiz(): Q[] {
  const ls = LETTERS.filter((l) => l.lat !== "-");
  const a = pick(ls, 4).map((l): Q => ({ prompt: l.ch, opts: shuffle([l.lat, ...pick(ls.filter((x) => x.lat !== l.lat), 2).map((x) => x.lat)]), ans: l.lat, rtl: true, explain: `${l.ch} = ${l.lat}` }));
  const b = pick(ls, 3).map((l): Q => ({ prompt: l.lat, opts: shuffle([l.ch, ...pick(ls.filter((x) => x.ch !== l.ch), 2).map((x) => x.ch)]), ans: l.ch, rtl: false, explain: `${l.lat} = ${l.ch}` }));
  const c = pick(READ, 3).map(([w, lat]): Q => ({ prompt: w, small: t("alphaReadQ"), opts: shuffle([lat, ...pick(READ.filter((x) => x[1] !== lat), 2).map((x) => x[1])]), ans: lat, rtl: true, explain: `${w} = ${lat}` }));
  return [...a, ...b, ...c];
}

/** Soranî alphabet trainer: every letter with its shapes, sound and an example; plus a 10-question game. */
export default function Alpha() {
  const th = useTheme();
  const [open, setOpen] = useState<L | null>(null);
  const [quiz, setQuiz] = useState<Q[] | null>(null);
  const [qi, setQi] = useState(0); const [sel, setSel] = useState<string | null>(null); const [right, setRight] = useState(0);
  const start = () => { setQuiz(makeQuiz()); setQi(0); setSel(null); setRight(0); };

  if (quiz) {
    const done = qi >= quiz.length, q = quiz[Math.min(qi, quiz.length - 1)];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, height: 60 }}>
          <Pressable onPress={() => setQuiz(null)} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
          <View style={{ flex: 1 }}><Meter pct={(qi / quiz.length) * 100} h={8} /></View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14, maxWidth: 560, width: "100%", alignSelf: "center" }}>
          {done ? (<>
            <Text style={{ fontFamily: F.display, fontSize: 30, color: th.ink, textAlign: "center", paddingTop: 30 }}>{t("alphaDone")}</Text>
            <Text style={{ fontFamily: F.bodySemi, fontSize: TS.lg, color: th.muted, textAlign: "center" }}>{right} / {quiz.length}</Text>
            <Btn title={t("bridgeAgain")} kind="sky" upper={false} onPress={start} />
            <Btn title={t("contOn")} onPress={() => setQuiz(null)} />
          </>) : (<>
            <Text style={{ fontFamily: F.italicBold, fontSize: TS.md, color: th.keskDeep }}>{q.small ?? (q.rtl ? t("alphaQ") : t("alphaQRev"))}</Text>
            <Text style={{ fontFamily: F.serif, fontSize: q.prompt.length > 2 ? 48 : 84, lineHeight: q.prompt.length > 2 ? 64 : 110, color: th.ink, textAlign: "center" }}>{q.prompt}</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {q.opts.map((o) => {
                const ok = o === q.ans; const bc = sel ? (ok ? th.kesk : o === sel ? th.sor : th.line2) : th.line2;
                return (
                  <Pressable key={o} disabled={!!sel} onPress={() => { setSel(o); sfx(ok ? "ok" : "bad"); buzz(ok ? "ok" : "bad"); if (ok) setRight((r) => r + 1); }} accessibilityRole="button"
                    style={{ flex: 1, minHeight: 76, alignItems: "center", justifyContent: "center", borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: bc, backgroundColor: th.surface }}>
                    <Text style={{ fontFamily: F.serif, fontSize: o.length > 3 ? 20 : 30, color: th.ink }}>{o}</Text>
                  </Pressable>);
              })}
            </View>
            {sel ? <>
              <Text style={{ fontFamily: F.serif, fontSize: TS.lg, color: th.ink, textAlign: "center" }}>{q.explain}</Text>
              <Btn title={t("cont")} onPress={() => { setSel(null); const n = qi + 1; setQi(n); if (n >= quiz.length) { addXP(5 + right); sfx("win"); confetti(); } }} />
            </> : null}
          </>)}
        </ScrollView>
      </SafeAreaView>);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 60 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("alphaTitle")}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 22, color: th.muted }}>{t("alphaLead")}</Text>
        <Btn title={t("alphaStart")} kind="sky" upper={false} onPress={start} />
        {open ? (
          <View style={{ gap: 8, padding: 16, borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: th.panel }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: F.display, fontSize: TS.xl, color: th.panelInk }}>{open.ch}  =  {open.lat}</Text>
              <Pressable onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}><Icon.x size={20} color={th.panelInk} /></Pressable>
            </View>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.xs, color: th.panelInk, opacity: 0.8 }}>{open.joins ? t("alphaForms4") : t("alphaForms2")}</Text>
            <View style={{ flexDirection: "row-reverse", gap: 14, flexWrap: "wrap" }}>
              {forms(open).map((f, i) => <Text key={i} style={{ fontFamily: F.serif, fontSize: 44, lineHeight: 60, color: th.panelInk }}>{f}</Text>)}
            </View>
            {open.note ? <Text style={{ fontFamily: F.body, fontSize: TS.sm, lineHeight: 20, color: th.panelInk }}>{M(open.note)}</Text> : null}
            {open.ex ? <Text style={{ fontFamily: F.serif, fontSize: TS.lg, color: th.panelInk }}>{open.ex} · {open.exLat} · {M(open.exM ?? "")}</Text> : null}
          </View>) : null}
        <H2>{t("alphaAll")}</H2>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {LETTERS.map((l) => (
            <Pressable key={l.ch} onPress={() => { sfx("tap"); setOpen(l); }} accessibilityRole="button" accessibilityLabel={`${l.ch} ${l.lat}`}
              style={{ width: 72, height: 80, alignItems: "center", justifyContent: "center", borderRadius: 12, borderTopLeftRadius: 3, borderWidth: 1.5, borderBottomWidth: 3, borderColor: open === l ? th.plum : th.line2, backgroundColor: th.surface }}>
              <Text style={{ fontFamily: F.serif, fontSize: 30, lineHeight: 42, color: th.ink }}>{l.ch}</Text>
              <Text style={{ fontFamily: F.bodySemi, fontSize: TS.xs, color: th.muted }}>{l.lat}</Text>
            </Pressable>))}
        </View>
        <KilimRule color={th.zer} accent={th.sor} h={10} seed={4} />
      </ScrollView>
    </SafeAreaView>
  );
}
