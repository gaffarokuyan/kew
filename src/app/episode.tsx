import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx, speak, stopVoice } from "@/lib/audio";
import { scriptOf } from "@/lib/course";
import { shuffle } from "@/lib/exercises";
import { M, t } from "@/lib/i18n";
import { episode, episodesFor, fmt, lineAt, loadPods, usePodsVersion, type PodLine } from "@/lib/podcast";
import { addXP, getS, update } from "@/lib/store";
import { Avatar, KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti, Meter } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

const SPEEDS = [0.75, 1, 1.25];

/** One podcast episode: player (when audio exists), live transcript, key words and a 3-question check. */
export default function EpisodeScreen() {
  const th = useTheme();
  usePodsVersion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = episode(String(id));
  useEffect(() => { loadPods(); }, []);

  const player = useAudioPlayer(e?.audio ? { uri: e.audio } : null, { updateInterval: 250 });
  const st = useAudioPlayerStatus(player);
  const [speed, setSpeed] = useState(1);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [all, setAll] = useState(false);
  const [phase, setPhase] = useState<"listen" | "quiz" | "done">("listen");
  const [qi, setQi] = useState(0); const [sel, setSel] = useState<number | null>(null); const [right, setRight] = useState(0);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null); const ys = useRef<number[]>([]);

  const quiz = useMemo(() => (e?.quiz ?? []).map((q) => ({ q: q.q, opts: shuffle(q.o.map((o, i) => ({ o, ok: i === q.a }))) })), [e]);
  const cur = e?.audio ? lineAt(e, st.currentTime) : -1;
  useEffect(() => { if (cur >= 0 && st.playing && ys.current[cur] != null) scroll.current?.scrollTo({ y: Math.max(0, ys.current[cur] - 120), animated: true }); }, [cur, st.playing]);

  if (!e) return <SafeAreaView style={{ flex: 1, backgroundColor: th.bg, alignItems: "center", justifyContent: "center" }}><Btn title={t("close")} onPress={() => router.back()} /></SafeAreaView>;

  const sc = e.course === "ckb" ? scriptOf() : null;
  const main = (l: PodLine) => (sc === "lat" && l.lat ? l.lat : l.t);
  const sub = (l: PodLine) => (sc === "both" && l.lat ? l.lat : null);
  const rtl = /[\u0600-\u06FF]/.test(main(e.lines[0]));
  const close = () => { try { player.pause(); } catch {} stopVoice(); router.back(); };
  const toggle = () => { if (st.playing) player.pause(); else { if (st.didJustFinish || (st.duration && st.currentTime >= st.duration - 0.3)) player.seekTo(0); player.play(); } };
  const seek = (d: number) => player.seekTo(Math.max(0, Math.min((st.duration || 0) - 0.2, st.currentTime + d)));
  const setRate = (r: number) => { setSpeed(r); try { player.setPlaybackRate(r, "high"); } catch {} };
  const tapLine = (i: number) => {
    sfx("tap");
    const l = e.lines[i];
    if (e.audio && l.at != null) { player.seekTo(l.at); if (!st.playing) player.play(); } else speak(l.t);
    setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };
  const finish = () => {
    const first = !getS().pods[e.id];
    update((s) => { s.pods = { ...s.pods, [e.id]: Date.now() }; });
    addXP(first ? 10 + right * 2 : 3 + right); sfx("win"); buzz("win"); confetti(); setPhase("done");
  };
  const list = episodesFor(e.course); const next = list[list.findIndex((x) => x.id === e.id) + 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, height: 60 }}>
        <Text numberOfLines={1} accessibilityRole="header" style={{ flex: 1, fontFamily: F.display, fontSize: TS.lg, color: th.ink }}>{e.lvl} · {t("podEp", { n: e.n })}</Text>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>

      {phase === "listen" ? (<>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, paddingTop: 0, gap: 14, maxWidth: 560, width: "100%", alignSelf: "center" }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 36, color: th.ink, textAlign: rtl ? "right" : "left" }}>{sc === "lat" && e.titleLat ? e.titleLat : e.title}</Text>
            <Text style={{ fontFamily: F.bodySemi, fontSize: TS.md, color: th.muted }}>{M(e.name)} · {M(e.sub)}</Text>
          </View>
          {!e.audio ? <Text style={{ fontFamily: F.italic, fontSize: TS.sm, lineHeight: 20, color: th.muted }}>{t("podReadMode")}</Text> : <Text style={{ fontFamily: F.italic, fontSize: TS.sm, color: th.muted }}>{t("podHint")}</Text>}
          <Pressable onPress={() => setAll((a) => !a)} accessibilityRole="button" style={{ alignSelf: "flex-start", paddingVertical: 6 }}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.sm, color: th.sky }}>{all ? t("podHide") : t("podShow")}</Text>
          </Pressable>
          <KilimRule color={th.zer} accent={th.sor} h={10} seed={e.n * 3} />
          {e.lines.map((l, i) => {
            const on = i === cur, show = all || open.has(i), s2 = sub(l);
            return (
              <Pressable key={i} onPress={() => tapLine(i)} onLayout={(ev) => { ys.current[i] = ev.nativeEvent.layout.y; }} accessibilityRole="button" accessibilityLabel={`${l.s}: ${main(l)}`}
                style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 12, padding: 10, borderRadius: 12, backgroundColor: on ? th.surface : "transparent", borderWidth: on ? 1.5 : 0, borderColor: th.zer }}>
                <View style={{ alignItems: "center", width: 46 }}>
                  <Avatar name={l.s} size={40} />
                  <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 11, color: th.muted }}>{l.s}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 20, lineHeight: 28, color: th.ink, textAlign: rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr" }}>{main(l)}</Text>
                  {s2 ? <Text style={{ fontFamily: F.italic, fontSize: TS.sm, color: th.muted }}>{s2}</Text> : null}
                  {show ? <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 21, color: th.keskDeep }}>{M(l.m)}</Text> : null}
                </View>
              </Pressable>);
          })}
          <View style={{ gap: 8, padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>
            <Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{t("podWords")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {e.words.map(([w, m]) => (
                <View key={w} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: th.bg, borderWidth: 1, borderColor: th.line2 }}>
                  <Text style={{ fontFamily: F.serif, fontSize: TS.md, color: th.ink }}>{w}</Text>
                  <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.muted }}>{M(m)}</Text>
                </View>))}
            </View>
          </View>
          <Btn title={t("readQuiz")} onPress={() => { try { player.pause(); } catch {} stopVoice(); setPhase("quiz"); }} />
        </ScrollView>

        {e.audio ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, gap: 8, borderTopWidth: 1, borderColor: th.line, backgroundColor: th.bg }}>
            <Meter pct={st.duration ? (st.currentTime / st.duration) * 100 : 0} h={6} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: TS.xs, color: th.muted, fontVariant: ["tabular-nums"], width: 70 }}>{fmt(st.currentTime)} / {fmt(st.duration || e.dur || 0)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Pressable onPress={() => seek(-10)} accessibilityRole="button" accessibilityLabel={t("podBack")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.back10 size={26} color={th.ink} /></Pressable>
                <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={st.playing ? t("podPause") : t("podPlay")}
                  style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: th.plum, alignItems: "center", justifyContent: "center" }}>
                  {st.playing ? <Icon.pause size={26} /> : <Icon.play size={26} />}
                </Pressable>
                <Pressable onPress={() => seek(10)} accessibilityRole="button" accessibilityLabel={t("podFwd")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.fwd10 size={26} color={th.ink} /></Pressable>
              </View>
              <Pressable onPress={() => setRate(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} accessibilityRole="button" accessibilityLabel={`${t("podSpeed")} ${speed}x`} style={{ width: 70, height: 44, alignItems: "flex-end", justifyContent: "center" }}>
                <Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{speed}x</Text>
              </Pressable>
            </View>
          </View>) : null}
      </>) : phase === "quiz" ? (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14, maxWidth: 560, width: "100%", alignSelf: "center" }}>
          <Meter pct={(qi / Math.max(1, quiz.length)) * 100} h={8} />
          <Text style={{ fontFamily: F.display, fontSize: 26, lineHeight: 32, color: th.ink }}>{M(quiz[qi].q)}</Text>
          {quiz[qi].opts.map((o, i) => {
            const bc = sel != null ? (o.ok ? th.kesk : i === sel ? th.sor : th.line2) : th.line2;
            return <Pressable key={i} disabled={sel != null} onPress={() => { setSel(i); sfx(o.ok ? "ok" : "bad"); buzz(o.ok ? "ok" : "bad"); if (o.ok) setRight((r) => r + 1); }} accessibilityRole="button"
              style={{ minHeight: 56, justifyContent: "center", padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: bc, backgroundColor: th.surface }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 17, color: th.ink }}>{M(o.o)}</Text></Pressable>;
          })}
          {sel != null ? <Btn title={t("cont")} onPress={() => { setSel(null); if (qi + 1 >= quiz.length) finish(); else setQi(qi + 1); }} /> : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center", alignItems: "stretch" }}>
          <View style={{ alignItems: "center", paddingTop: 20 }}><Avatar name="Juji" size={96} /></View>
          <Text style={{ fontFamily: F.display, fontSize: 30, color: th.ink, textAlign: "center" }}>{t("podDone")}</Text>
          <Text style={{ fontFamily: F.bodySemi, fontSize: TS.lg, color: th.muted, textAlign: "center" }}>{right} / {quiz.length}</Text>
          {next ? <Btn title={`${t("podNext")}: ${next.title}`} kind="sky" upper={false} onPress={() => router.replace({ pathname: "/episode", params: { id: next.id } })} /> : null}
          <Btn title={t("contOn")} onPress={close} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
