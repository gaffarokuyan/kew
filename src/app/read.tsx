import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hasAudio, sfx, speak, stopVoice } from "@/lib/audio";
import { UNITS } from "@/lib/course";
import { pick, shuffle } from "@/lib/exercises";
import { M, t } from "@/lib/i18n";
import { addXP, getS } from "@/lib/store";
import { KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

/** Comprehensible input: a short text made from the sentences of a unit the learner already knows, read and heard as one passage. */
export default function Read() {
  const th = useTheme();
  const { unit, qs } = useMemo(() => {
    const s = getS(); const known = UNITS.filter((u) => u.words.some((w) => s.words[w[0]]));
    const u = known.length ? pick(known.slice(-4), 1)[0] : UNITS[0];
    const others = UNITS.flatMap((x) => x.sents.map((y) => M(y[1])));
    const qs = pick(u.sents, Math.min(3, u.sents.length)).map((x) => ({ ku: x[0], ans: M(x[1]), opts: shuffle([M(x[1]), ...pick(others.filter((o) => o !== M(x[1])), 2)]) }));
    return { unit: u, qs };
  }, []);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [qi, setQi] = useState(-1); const [sel, setSel] = useState<string | null>(null); const [right, setRight] = useState(0);
  const playing = useRef(false);
  const playAll = (i = 0) => {
    if (i === 0) playing.current = true;
    if (!playing.current || i >= unit.sents.length) { playing.current = false; return; }
    if (!speak(unit.sents[i][0], false, () => playAll(i + 1))) playAll(i + 1);
  };
  const close = () => { playing.current = false; stopVoice(); router.back(); };
  const audio = unit.sents.some((x) => hasAudio(x[0]));
  const done = qi >= qs.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 60 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("readTitle")}</Text>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        {qi < 0 ? (<>
          <Text style={{ fontFamily: F.display, fontSize: 30, color: th.ink }}>{unit.ku}</Text>
          <Text style={{ fontFamily: F.italic, color: th.muted }}>{t("readHint")}</Text>
          {audio ? <Btn title={t("readPlay")} kind="sky" upper={false} icon={<Icon.spk size={20} />} onPress={() => playAll(0)} /> : null}
          <View style={{ padding: 18, gap: 12, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>
            <KilimRule color={th.zer} accent={th.sor} h={10} seed={unit.ku.length} />
            {unit.sents.map((x, i) => (
              <Pressable key={i} onPress={() => { sfx("tap"); speak(x[0]); setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; }); }} accessibilityRole="button">
                <Text style={{ fontFamily: F.serif, fontSize: 22, lineHeight: 31, color: th.ink }}>{x[0]}</Text>
                {open.has(i) ? <Text style={{ fontFamily: F.body, fontSize: TS.md, color: th.muted }}>{M(x[1])}</Text> : null}
              </Pressable>))}
          </View>
          <Btn title={t("readQuiz")} onPress={() => { playing.current = false; stopVoice(); setQi(0); }} />
        </>) : !done ? (<>
          <Text style={{ fontFamily: F.display, fontSize: 26, lineHeight: 32, color: th.ink }}>{t("readQ", { s: qs[qi].ku })}</Text>
          {qs[qi].opts.map((o) => {
            const st = sel ? (o === qs[qi].ans ? th.kesk : o === sel ? th.sor : th.line2) : th.line2;
            return <Pressable key={o} disabled={!!sel} onPress={() => { setSel(o); const ok = o === qs[qi].ans; sfx(ok ? "ok" : "bad"); buzz(ok ? "ok" : "bad"); if (ok) setRight((r) => r + 1); }} accessibilityRole="button"
              style={{ minHeight: 56, justifyContent: "center", padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: st, backgroundColor: th.surface }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 17, color: th.ink }}>{o}</Text></Pressable>;
          })}
          {sel ? <Btn title={t("cont")} onPress={() => { setSel(null); const n = qi + 1; setQi(n); if (n >= qs.length) { addXP(5 + right); sfx("win"); confetti(); } }} /> : null}
        </>) : (<>
          <Text style={{ fontFamily: F.display, fontSize: 30, color: th.ink, textAlign: "center" }}>{t("readDone")}</Text>
          <Text style={{ fontFamily: F.bodySemi, fontSize: TS.lg, color: th.muted, textAlign: "center" }}>{right} / {qs.length}</Text>
          <Btn title={t("contOn")} onPress={close} />
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
