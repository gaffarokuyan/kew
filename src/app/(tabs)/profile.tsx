import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { NODES, SECTIONS, UNIT, UNITS } from "@/lib/course";
import { LANGS, t, t2, tArr } from "@/lib/i18n";
import { day, dayAdd, getS, learned, useS, type State } from "@/lib/store";
import { Kew } from "@/ui/art";
import { Icon } from "@/ui/icons";
import { Btn, Meter } from "@/ui/kit";
import { F, useTheme } from "@/ui/theme";

const lvlPct = (l: string, s: State) => { const ns = NODES.filter((n) => SECTIONS[UNIT[n.unit].si].lvl === l); return Math.round((ns.filter((n) => s.done[n.id]).length / ns.length) * 100); };
const BADGES: [string, (s: State) => number, number][] = [
  ["b1", (s) => s.stats.lessons, 1], ["b2", (s) => s.best, 7], ["b3", (s) => learned(s).length, 50], ["b4", (s) => s.stats.perfect, 5],
  ["b5", (s) => s.stats.stories, 3], ["b6", (s) => s.xp, 1000], ["b7", (s) => s.stats.jumps, 1], ["b8", (s) => lvlPct("A1", s), 100], ["b9", (s) => lvlPct("A2", s), 100],
];

function Week() {
  const th = useTheme(); const s = getS();
  const days = [...Array(7)].map((_, i) => dayAdd(day(), i - 6)), vals = days.map((d) => s.xpLog[d] || 0), max = Math.max(s.goal, ...vals);
  const W = 320, H = 150, pad = 22, bw = 28, gap = (W - pad * 2 - bw * 7) / 6, gy = H - 24 - (s.goal / max) * (H - 48); const names = tArr("days");
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={pad} x2={W - pad} y1={H - 24} y2={H - 24} stroke={th.line} strokeWidth={2} />
      <Line x1={pad} x2={W - pad} y1={gy} y2={gy} stroke={th.zer} strokeWidth={2} strokeDasharray="5 5" />
      <SvgText x={pad} y={gy - 5} fontSize={11} fontFamily="Nunito_700Bold" fill={th.muted}>{t("goalLine", { n: s.goal })}</SvgText>
      {vals.map((v, i) => { const h = (v / max) * (H - 48), x = pad + i * (bw + gap), y = H - 24 - h; return (
        <Svg key={i}>
          <Rect x={x} y={y} width={bw} height={Math.max(h, 0)} rx={6} fill={i === 6 ? th.kesk : th.keskSoft} />
          {v ? <SvgText x={x + bw / 2} y={y - 5} fontSize={11} fontFamily="Nunito_800ExtraBold" textAnchor="middle" fill={th.ink}>{String(v)}</SvgText> : null}
          <SvgText x={x + bw / 2} y={H - 7} fontSize={11} fontFamily="Nunito_700Bold" textAnchor="middle" fill={th.muted}>{names[new Date(days[i] + "T12:00").getDay()]}</SvgText>
        </Svg>); })}
    </Svg>
  );
}

export default function Profile() {
  const th = useTheme(); const s = useS();
  const units = UNITS.filter((u) => NODES.filter((n) => n.unit === u.id).every((n) => s.done[n.id])).length;
  const li = Math.max(0, ["tr", "en", "de"].indexOf(s.lang || "tr"));
  const card = { padding: 16, borderRadius: 18, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface, gap: 12 } as const;
  const kpi = (ic: React.ReactNode, v: string | number, l: string) => (
    <View style={{ width: "48%", flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface }}>
      {ic}<View><Text style={{ fontFamily: F.display, fontSize: 22, color: th.ink }}>{v}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{l}</Text></View>
    </View>);
  return (
    <ScrollView style={{ backgroundColor: th.bg }} contentContainerStyle={{ padding: 16, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: th.keskSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}><Kew size={86} /></View>
        <View><Text style={{ fontFamily: F.display, fontSize: 26, color: th.ink }}>{t("learner")}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{t("learnerSub")} · {LANGS[li][1]}</Text></View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }}>
        {kpi(<Icon.fire size={28} />, s.streak, t("kStreak"))}{kpi(<Icon.bolt size={28} color={th.zer} />, s.xp, t("kXp"))}
        {kpi(<Icon.words size={28} color={th.kesk} />, learned(s).length, t("kWords"))}{kpi(<Icon.trophy size={28} color={th.sky} />, `${units}/${UNITS.length}`, t("kUnits"))}
      </View>
      <View style={card}>
        <Text style={{ fontFamily: F.display, fontSize: 20, color: th.ink }}>{t("levels")}</Text>
        {(["A1", "A2"] as const).map((l) => { const p = lvlPct(l, s); return (
          <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ width: 42, textAlign: "center", paddingVertical: 4, borderRadius: 9, overflow: "hidden", backgroundColor: l === "A1" ? "#1f8a4c" : "#1c8fc7", color: "#fff", fontFamily: F.display }}>{l}</Text>
            <View style={{ flex: 1 }}><Meter pct={p} /></View><Text style={{ width: 44, textAlign: "right", fontFamily: F.bodyHeavy, color: th.muted }}>{p}%</Text>
          </View>); })}
      </View>
      <View style={card}><Text style={{ fontFamily: F.display, fontSize: 20, color: th.ink }}>{t("thisWeek")}</Text><Week /></View>
      <View style={card}>
        <Text style={{ fontFamily: F.display, fontSize: 20, color: th.ink }}>{t("badges")}</Text>
        {BADGES.map(([k, f, max]) => { const v = f(s), got = v >= max, [nm, ds] = t2(k); return (
          <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 14, backgroundColor: got ? th.zerSoft : th.bg }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: got ? th.zer : th.surface2, alignItems: "center", justifyContent: "center" }}><Icon.trophy size={24} color={got ? "#3a2a00" : th.faint} /></View>
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{nm}</Text><Text style={{ fontFamily: F.body, fontSize: 13, color: th.muted }}>{got ? ds : `${Math.min(v, max)}/${max} · ${ds}`}</Text></View>
          </View>); })}
      </View>
      <Btn title={t("settings")} kind="ghost" icon={<Icon.gear size={20} color={th.ink} />} onPress={() => router.push("/settings")} />
    </ScrollView>
  );
}
