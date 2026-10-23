import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { speak, sfx } from "@/lib/audio";
import { SAYINGS } from "@/lib/course";
import { M, t, up } from "@/lib/i18n";
import { day, learned, update, useS, wordStrength } from "@/lib/store";
import { Icon } from "@/ui/icons";
import { Btn, confetti, Meter, toast } from "@/ui/kit";
import { F, useTheme } from "@/ui/theme";

function Ring({ p }: { p: number }) {
  const th = useTheme(); const r = 36, c = 2 * Math.PI * r; const v = Math.min(1, p);
  return (
    <Svg width={88} height={88} viewBox="0 0 88 88">
      <Circle cx={44} cy={44} r={r} fill="none" stroke={th.surface2} strokeWidth={10} />
      <Circle cx={44} cy={44} r={r} fill="none" stroke={th.zer} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 44 44)" />
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
    { id: "combo", tx: t("qCombo"), v: d.bestCombo, max: 5, g: 20, ic: <Icon.fire size={26} /> },
  ];
  const card = { padding: 16, borderRadius: 18, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface, gap: 12 } as const;
  const modes = [
    { k: "weak", c: th.kesk, ic: <Icon.redo size={26} />, ti: t("pWords"), su: lw.length < 4 ? t("pNeed4") : t("pWordsSub", { n: weak.length }), dis: lw.length < 4 },
    { k: "mistakes", c: th.sor, ic: <Icon.target size={26} color="#fff" />, ti: t("pMist"), su: t("pMistSub", { n: s.mistakes.length }), dis: s.mistakes.length < 2 },
    { k: "listen", c: th.sky, ic: <Icon.ear size={26} color="#fff" />, ti: t("pListen"), su: s.set.voice ? t("pListenSub") : t("voiceOff"), dis: lw.length < 4 || !s.set.voice },
    { k: "sprint", c: "#8a4fbf", ic: <Icon.bolt size={26} color="#fff" />, ti: t("pSprint"), su: t("pSprintSub"), dis: lw.length < 6 },
  ];
  return (
    <ScrollView style={{ backgroundColor: th.bg }} contentContainerStyle={{ padding: 16, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: 30, color: th.ink }}>{t("practice")}</Text>
      <Text style={{ fontFamily: F.body, color: th.muted, marginTop: -10 }}>{t("practiceLead")}</Text>
      <Pressable onPress={() => speak(say[0])} accessibilityRole="button" style={[card, { backgroundColor: th.zerSoft, borderColor: th.zer, gap: 4 }]}>
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.4, color: th.zerDeep }}>{up(t("saying"))}</Text>
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 18, color: th.ink }}>{say[0]}</Text>
        <Text style={{ fontFamily: F.body, color: th.muted }}>{M(say[1])}</Text>
      </Pressable>
      <View style={[card, { flexDirection: "row", alignItems: "center", gap: 16 }]}>
        <Ring p={d.xp / s.goal} />
        <View><Text style={{ fontFamily: F.display, fontSize: 20, color: th.ink }}>{t("dailyGoal")}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{d.xp} / {s.goal} XP · {t("lessonsN", { n: d.lessons })}</Text></View>
      </View>
      <View style={card}>
        <Text style={{ fontFamily: F.display, fontSize: 20, color: th.ink }}>{t("quests")}</Text>
        {quests.map((q) => { const dn = q.v >= q.max, cl = d.claimed.includes(q.id); return (
          <View key={q.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {q.ic}
            <View style={{ flex: 1, gap: 6 }}><Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{q.tx}</Text><Meter pct={(q.v / q.max) * 100} /></View>
            {cl ? <Text style={{ fontFamily: F.bodyHeavy, color: th.kesk }}>{t("claimed")}</Text>
              : dn ? <Btn title={`+${q.g}`} kind="gold" style={{ paddingVertical: 8, paddingHorizontal: 12 }} onPress={() => { update((x) => { x.daily.claimed.push(q.id); x.gems += q.g; }); sfx("chest"); confetti(); toast(t("gemsWon", { n: q.g })); }} />
              : <Text style={{ fontFamily: F.bodyHeavy, color: th.faint }}>{Math.min(q.v, q.max)}/{q.max}</Text>}
          </View>); })}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {modes.map((m) => (
          <Pressable key={m.k} disabled={m.dis} onPress={() => { sfx("tap"); router.push({ pathname: "/lesson", params: { practice: m.k } }); }} accessibilityRole="button" accessibilityState={{ disabled: m.dis }}
            style={({ pressed }) => ({ width: "47.8%", padding: 14, gap: 8, borderRadius: 18, borderWidth: 2, borderBottomWidth: pressed ? 2 : 5, marginTop: pressed ? 3 : 0, borderColor: th.line, backgroundColor: th.surface, opacity: m.dis ? 0.5 : 1 })}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: m.c, alignItems: "center", justifyContent: "center" }}>{m.ic}</View>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 16, color: th.ink }}>{m.ti}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 13, color: th.muted }}>{m.su}</Text>
          </Pressable>))}
      </View>
    </ScrollView>
  );
}
