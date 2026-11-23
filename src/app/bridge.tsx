import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import data from "@/content/bridge.json";
import { hasAudio, sfx, speak } from "@/lib/audio";
import { pick, shuffle, norm } from "@/lib/exercises";
import { M, t } from "@/lib/i18n";
import { addXP } from "@/lib/store";
import { KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti, H2, Meter } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

type Row = { m: string; lvl: string; topic: string; kmr: string; ckb: string; ckbLat: string; zza: string | null };
const ROWS = data.rows as Row[];
const RULES = data.rules as [string, string, [string, string][]][];
const Q_N = 8;

/** Dialect bridge: the same word in Kurmancî, Soranî and Zazakî, the sound rules between them, and a short quiz. */
export default function Bridge() {
  const th = useTheme();
  const [q, setQ] = useState("");
  const [quiz, setQuiz] = useState<{ r: Row; opts: Row[] }[] | null>(null);
  const [qi, setQi] = useState(0); const [sel, setSel] = useState<Row | null>(null); const [right, setRight] = useState(0);

  const list = useMemo(() => {
    const n = norm(q);
    return n ? ROWS.filter((r) => [r.kmr, r.ckb, r.ckbLat, r.zza ?? "", M(r.m)].some((x) => norm(x).includes(n))) : ROWS;
  }, [q]);

  const start = () => {
    const qs = pick(ROWS.filter((r) => norm(r.kmr) !== norm(r.ckbLat)), Q_N).map((r) => ({ r, opts: shuffle([r, ...pick(ROWS.filter((x) => x !== r && norm(x.ckbLat) !== norm(r.ckbLat)), 2)]) }));
    setQuiz(qs); setQi(0); setSel(null); setRight(0);
  };
  const close = () => router.back();

  if (quiz) {
    const done = qi >= quiz.length;
    const cur = quiz[Math.min(qi, quiz.length - 1)];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, height: 60 }}>
          <Pressable onPress={() => setQuiz(null)} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
          <View style={{ flex: 1 }}><Meter pct={(qi / quiz.length) * 100} h={8} /></View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14, maxWidth: 560, width: "100%", alignSelf: "center" }}>
          {done ? (<>
            <Text style={{ fontFamily: F.display, fontSize: 30, color: th.ink, textAlign: "center", paddingTop: 30 }}>{t("bridgeDone")}</Text>
            <Text style={{ fontFamily: F.bodySemi, fontSize: TS.lg, color: th.muted, textAlign: "center" }}>{right} / {quiz.length}</Text>
            <Btn title={t("bridgeAgain")} kind="sky" upper={false} onPress={start} />
            <Btn title={t("contOn")} onPress={() => setQuiz(null)} />
          </>) : (<>
            <Text style={{ fontFamily: F.italicBold, fontSize: TS.md, color: th.keskDeep }}>{t("bridgeQ")}</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 40, color: th.ink }}>{cur.r.kmr}</Text>
              <Text style={{ fontFamily: F.body, fontSize: TS.md, color: th.muted }}>Kurmancî · {M(cur.r.m)}</Text>
            </View>
            {cur.opts.map((o, i) => {
              const ok = o === cur.r; const st = sel ? (ok ? th.kesk : o === sel ? th.sor : th.line2) : th.line2;
              return (
                <Pressable key={i} disabled={!!sel} onPress={() => { setSel(o); sfx(ok ? "ok" : "bad"); buzz(ok ? "ok" : "bad"); if (ok) setRight((r) => r + 1); }} accessibilityRole="button"
                  style={{ minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: st, backgroundColor: th.surface }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 20, color: th.ink }}>{o.ckbLat}</Text>
                  <Text style={{ fontFamily: F.serif, fontSize: 22, color: th.muted, writingDirection: "rtl" }}>{o.ckb}</Text>
                </Pressable>);
            })}
            {sel ? <>
              <Text style={{ fontFamily: F.body, fontSize: TS.md, color: th.ink }}>{cur.r.kmr} = {cur.r.ckbLat} ({cur.r.ckb}){cur.r.zza ? ` · Zazakî: ${cur.r.zza}` : ""}</Text>
              <Btn title={t("cont")} onPress={() => { setSel(null); const n = qi + 1; setQi(n); if (n >= quiz.length) { addXP(5 + right); sfx("win"); confetti(); } }} />
            </> : null}
          </>)}
        </ScrollView>
      </SafeAreaView>);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 60 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("bridgeTitle")}</Text>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 22, color: th.muted }}>{t("bridgeLead", { n: ROWS.length })}</Text>
        <Btn title={t("bridgeStart")} kind="sky" upper={false} onPress={start} />

        <H2>{t("bridgeRules")}</H2>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
          {RULES.map(([title, m, ex]) => (
            <View key={title} style={{ width: 230, gap: 6, padding: 14, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: th.panel }}>
              <Text style={{ fontFamily: F.display, fontSize: TS.lg, color: th.panelInk }}>{title}</Text>
              <Text style={{ fontFamily: F.body, fontSize: TS.sm, lineHeight: 19, color: th.panelInk }}>{M(m)}</Text>
              <Text style={{ fontFamily: F.serif, fontSize: TS.md, color: th.panelInk }}>{ex.map(([a, b]) => `${a} → ${b}`).join("   ")}</Text>
            </View>))}
        </ScrollView>

        <KilimRule color={th.zer} accent={th.sor} h={10} seed={11} />
        <TextInput value={q} onChangeText={setQ} placeholder={t("search")} placeholderTextColor={th.muted} accessibilityLabel={t("search")}
          style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface, color: th.ink, fontFamily: F.body, fontSize: TS.md }} />
        <View style={{ flexDirection: "row", paddingHorizontal: 4 }}>
          {["Kurmancî", "Soranî", "Zazakî"].map((h) => <Text key={h} style={{ flex: 1, fontFamily: F.bodyHeavy, fontSize: TS.xs, color: th.muted }}>{h}</Text>)}
        </View>
        {list.slice(0, 120).map((r) => (
          <Pressable key={r.kmr + r.ckb} onPress={() => { if (hasAudio(r.kmr)) speak(r.kmr); }} accessibilityRole="button" accessibilityLabel={`${M(r.m)}: Kurmancî ${r.kmr}, Soranî ${r.ckbLat}${r.zza ? ", Zazakî " + r.zza : ""}`}
            style={{ gap: 4, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: th.line }}>
            <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.muted }}>{M(r.m)}</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={{ flex: 1, fontFamily: F.serif, fontSize: TS.lg, color: th.ink }}>{r.kmr}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.serif, fontSize: TS.lg, color: th.ink }}>{r.ckbLat}</Text>
                <Text style={{ fontFamily: F.serif, fontSize: TS.md, color: th.muted, writingDirection: "rtl", textAlign: "left" }}>{r.ckb}</Text>
              </View>
              <Text style={{ flex: 1, fontFamily: F.serif, fontSize: TS.lg, color: r.zza ? th.ink : th.line2 }}>{r.zza ?? "—"}</Text>
            </View>
          </Pressable>))}
      </ScrollView>
    </SafeAreaView>
  );
}
