import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { speak, sfx } from "@/lib/audio";
import { SAYINGS } from "@/lib/course";
import { M, t } from "@/lib/i18n";
import { day, learned, update, useS, wordStrength } from "@/lib/store";
import { Icon } from "@/ui/icons";
import { KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Btn, confetti, H2, Meter, PageHead, toast } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

function Ring({ p }: { p: number }) {
  const th = useTheme(); const r = 36, c = 2 * Math.PI * r; const v = Math.min(1, p);
  return (
    <Svg width={88} height={88} viewBox="0 0 88 88">
      <Circle cx={44} cy={44} r={r} fill="none" stroke={th.surface2} strokeWidth={8} />
      <Circle cx={44} cy={44} r={r} fill="none" stroke={th.zer} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 44 44)" />
      <SvgText x={44} y={50} textAnchor="middle" fontSize={18} fontFamily="Nunito_800ExtraBold" fill={th.ink}>{`${Math.round(v * 100)}%`}</SvgText>
    </Svg>
  );
}

export default function Practice() {
  const th = useTheme(); const s = useS(); const lw = learned(s); const weak = lw.filter((k) => wordStrength(k, s) < 3);
  const d = s.daily; const say = SAYINGS[Math.floor(new Date(day() + "T12:00").getTime() / 864e5) % SAYINGS.length];
  const quests = [
    { id: "xp", tx: t("qXp", { n: s.goal }), v: d.xp, max: s.goal, g: 10, ic: <Icon.bolt size={26} color={th.zer} /> },
    { id: "les", tx: t("qLessons"), v: d.lessons, max: 2, g: 15, ic: <Icon.target size={26} color={th.sor} /> },
    { id: "combo", tx: t("qCombo"), v: d.bestCombo, max: 5, g: 20, ic: <Icon.fire size={26} color={th.fire} /> },
  ];
  const modes = [
    { k: "weak", c: th.kesk, ic: <Icon.redo size={26} />, ti: t("pWords"), su: lw.length < 4 ? t("pNeed4") : t("pWordsSub", { n: weak.length }), dis: lw.length < 4 },
    { k: "mistakes", c: th.sor, ic: <Icon.target size={26} color="#fff" />, ti: t("pMist"), su: t("pMistSub", { n: s.mistakes.length }), dis: s.mistakes.length < 2 },
    { k: "listen", c: th.sky, ic: <Icon.ear size={26} color="#fff" />, ti: t("pListen"), su: s.set.voice ? t("pListenSub") : t("voiceOff"), dis: lw.length < 4 || !s.set.voice },
    { k: "sprint", c: th.plum, ic: <Icon.bolt size={26} color="#fff" />, ti: t("pSprint"), su: t("pSprintSub"), dis: lw.length < 6 },
  ];
  return (
    <ScrollView style={{ backgroundColor: th.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 32, gap: 22, maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <PageHead title={t("practice")} lead={t("practiceLead")} />

      {/* Saying of the day: the one dark, woven panel on this screen. */}
      <Pressable onPress={() => speak(say[0])} accessibilityRole="button" accessibilityLabel={`${t("saying")}: ${say[0]}`}
        style={({ pressed }) => ({ borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: th.panel, overflow: "hidden", opacity: pressed ? 0.92 : 1 })}>
        <KilimRule color={th.zer} accent={th.sor} h={12} seed={say[0].length} style={{ marginTop: 12, marginHorizontal: 12, width: undefined }} />
        <View style={{ padding: 18, paddingTop: 14, gap: 6 }}>
          <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: "rgba(246,240,228,0.75)" }}>{t("saying")}</Text>
          <Text style={{ fontFamily: F.italicBold, fontSize: 25, lineHeight: 31, color: th.panelInk }}>{say[0]}</Text>
          <Text style={{ fontFamily: F.bodySemi, fontSize: TS.sm, lineHeight: 21, color: "rgba(246,240,228,0.82)" }}>{M(say[1])}</Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Ring p={d.xp / s.goal} />
        <View style={{ flex: 1 }}><H2>{t("dailyGoal")}</H2><Text style={{ fontFamily: F.bodySemi, color: th.muted }}>{d.xp} / {s.goal} XP, {t("lessonsN", { n: d.lessons })}</Text></View>
      </View>

      <View style={{ gap: 4 }}>
        <H2>{t("quests")}</H2>
        {quests.map((q, i) => { const dn = q.v >= q.max, cl = d.claimed.includes(q.id); return (
          <View key={q.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: th.line }}>
            {q.ic}
            <View style={{ flex: 1, gap: 7 }}><Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{q.tx}</Text><Meter pct={(q.v / q.max) * 100} h={8} /></View>
            {cl ? <Text style={{ fontFamily: F.bodyHeavy, color: th.keskDeep }}>{t("claimed")}</Text>
              : dn ? <Btn title={`+${q.g}`} kind="gold" style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 12 }} icon={<Icon.gem size={16} color="#2E1F00" />} onPress={() => { update((x) => { x.daily.claimed.push(q.id); x.gems += q.g; }); sfx("chest"); buzz("win"); confetti(); toast(t("gemsWon", { n: q.g })); }} />
              : <Text style={{ fontFamily: F.bodyHeavy, color: th.muted, fontVariant: ["tabular-nums"] }}>{Math.min(q.v, q.max)}/{q.max}</Text>}
          </View>); })}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
        {modes.map((m) => (
          <Pressable key={m.k} disabled={m.dis} onPress={() => { sfx("tap"); buzz("tap"); router.push({ pathname: "/lesson", params: { practice: m.k } }); }} accessibilityRole="button" accessibilityLabel={`${m.ti}. ${m.su}`} accessibilityState={{ disabled: m.dis }}
            style={({ pressed }) => ({ width: "48.5%", minHeight: 132, padding: 14, gap: 6, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: th.line2, backgroundColor: th.surface, opacity: m.dis ? 0.55 : 1 })}>
            <View style={{ width: 42, height: 42, borderRadius: 10, borderTopLeftRadius: 3, backgroundColor: m.c, alignItems: "center", justifyContent: "center" }}>{m.ic}</View>
            <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{m.ti}</Text>
            <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.muted }}>{m.su}</Text>
          </Pressable>))}
      </View>
    </ScrollView>
  );
}
