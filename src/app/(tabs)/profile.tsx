import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { COURSES, LEVELS, NODES, SECTIONS, UNIT, UNITS } from "@/lib/course";
import { myRank, TIERS } from "@/lib/league";
import { LANGS, t, t2, tArr } from "@/lib/i18n";
import { day, dayAdd, getS, learned, useS, type State } from "@/lib/store";
import { Diamond, Juji, KilimRule, Medallion } from "@/ui/art";
import { CourseBadge } from "@/ui/CourseBadge";
import { Icon } from "@/ui/icons";
import { Btn, H2, Meter } from "@/ui/kit";
import { F, levelCol, TS, useTheme } from "@/ui/theme";

const lvlPct = (l: string, s: State) => { const ns = NODES.filter((n) => SECTIONS[UNIT[n.unit].si].lvl === l); return ns.length ? Math.round((ns.filter((n) => s.done[n.id]).length / ns.length) * 100) : 0; };
/** Level-mastery badges: b8 = A1, b9 = A2, b10 = B1, … (only for levels present in the content). */
const LEVEL_BADGE: Record<string, string> = { A1: "b8", A2: "b9", B1: "b10" };
const BADGES: [string, (s: State) => number, number][] = [
  ["b1", (s) => s.stats.lessons, 1], ["b2", (s) => s.best, 7], ["b3", (s) => learned(s).length, 50], ["b4", (s) => s.stats.perfect, 5],
  ["b5", (s) => s.stats.stories, 3], ["b6", (s) => s.xp, 1000], ["b7", (s) => s.stats.jumps, 1],
  ...LEVELS.filter((l) => LEVEL_BADGE[l]).map((l) => [LEVEL_BADGE[l], (s: State) => lvlPct(l, s), 100] as [string, (s: State) => number, number]),
];

function Week() {
  const th = useTheme(); const s = getS();
  const days = [...Array(7)].map((_, i) => dayAdd(day(), i - 6)), vals = days.map((d) => s.xpLog[d] || 0), max = Math.max(s.goal, ...vals);
  const W = 320, H = 156, pad = 14, bw = 26, gap = (W - pad * 2 - bw * 7) / 6, gy = H - 24 - (s.goal / max) * (H - 48); const names = tArr("days");
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={pad} x2={W - pad} y1={H - 24} y2={H - 24} stroke={th.line2} strokeWidth={1} />
      <Line x1={pad} x2={W - pad} y1={gy} y2={gy} stroke={th.zer} strokeWidth={1.5} strokeDasharray="2 4" strokeLinecap="round" />
      {vals.map((v, i) => { const h = (v / max) * (H - 48), x = pad + i * (bw + gap), y = H - 24 - h; return (
        <Svg key={i}>
          <Rect x={x} y={v ? y : H - 28} width={bw} height={v ? Math.max(h, 4) : 4} rx={2} fill={v ? (i === 6 ? th.kesk : th.keskSoft) : th.line2} />
          {v ? <SvgText x={x + bw / 2} y={y - 5} fontSize={11} fontFamily="Nunito_800ExtraBold" textAnchor="middle" fill={th.ink}>{String(v)}</SvgText> : null}
          <SvgText x={x + bw / 2} y={H - 7} fontSize={11} fontFamily={i === 6 ? "Nunito_800ExtraBold" : "Nunito_700Bold"} textAnchor="middle" fill={i === 6 ? th.ink : th.muted}>{names[new Date(days[i] + "T12:00").getDay()]}</SvgText>
        </Svg>); })}
    </Svg>
  );
}

export default function Profile() {
  const th = useTheme(); const s = useS();
  const units = UNITS.filter((u) => NODES.filter((n) => n.unit === u.id).every((n) => s.done[n.id])).length;
  const li = Math.max(0, ["tr", "en", "de"].indexOf(s.lang || "tr"));
  const stat = (ic: React.ReactNode, v: string | number, l: string, last?: boolean) => (
    <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 6, alignItems: "center", gap: 2, borderRightWidth: last ? 0 : 1, borderColor: th.line }} accessible accessibilityLabel={`${l}: ${v}`}>
      {ic}
      <Text style={{ fontFamily: F.display, fontSize: TS.xl, lineHeight: 30, color: th.ink, fontVariant: ["tabular-nums"] }}>{v}</Text>
      <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{l}</Text>
    </View>);
  return (
    <ScrollView style={{ backgroundColor: th.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 32, gap: 22, maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 88, height: 88, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 66, height: 66, borderRadius: 14, transform: [{ rotate: "45deg" }], backgroundColor: th.keskSoft }} />
          <View><Juji size={84} /></View>
        </View>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontFamily: F.display, fontSize: 30, lineHeight: 36, color: th.ink }}>{s.lg?.nick ?? t("learner")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: -4 }}>
            <CourseBadge id={s.course} size={22} />
            <Text numberOfLines={2} style={{ flex: 1, fontFamily: F.bodySemi, fontSize: 14, color: th.muted }}>{COURSES.find((c) => c.id === s.course)?.name} · {LANGS[li][2]}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel={t("settings")} hitSlop={6}
          style={({ pressed }) => ({ alignSelf: "flex-start", width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? th.surface2 : "transparent" })}>
          <Icon.gear size={24} color={th.muted} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", borderRadius: 14, borderWidth: 1, borderColor: th.line, backgroundColor: th.surface }}>
        {stat(<Icon.fire size={22} color={th.fire} />, s.streak, t("kStreak"))}
        {stat(<Icon.bolt size={22} color={th.zer} />, s.xp, t("kXp"))}
        {stat(<Icon.words size={22} color={th.kesk} />, learned(s).length, t("kWords"))}
        {stat(<Icon.trophy size={22} color={th.sky} />, `${units}/${UNITS.length}`, t("kUnits"), true)}
      </View>

      <Pressable onPress={() => router.push("/league")} accessibilityRole="button" accessibilityLabel={t("lgTitle")}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: th.panel, opacity: pressed ? 0.92 : 1 })}>
        <Medallion size={58} color={TIERS[s.lgCache?.tier ?? 0].c} accent={th.zer} seed={(s.lgCache?.tier ?? 0) + 2} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: F.display, fontSize: 20, color: th.panelInk }}>{s.lg && s.lgCache ? t("lgTier", { t: TIERS[s.lgCache.tier].ku }) : t("lgTitle")}</Text>
          <Text style={{ fontFamily: F.body, fontSize: TS.sm, color: "rgba(246,240,228,0.8)" }}>
            {s.lg && s.lgCache ? `${myRank(s.lgCache) ? t("lgRank", { n: myRank(s.lgCache) }) + " · " : ""}${t("lgFriendsN", { n: s.lgCache.friends.length })}` : t("lgCardSub")}
          </Text>
        </View>
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 22, color: th.zer }}>›</Text>
      </Pressable>

      <View style={{ gap: 12 }}>
        <H2>{t("levels")}</H2>
        {LEVELS.map((l) => { const p = lvlPct(l, s); const c = levelCol(l, th); return (
          <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 12 }} accessible accessibilityLabel={`${l}: ${p}%`}>
            <Text style={{ width: 38, fontFamily: F.display, fontSize: TS.lg + 2, color: c }}>{l}</Text>
            <View style={{ flex: 1 }}><Meter pct={p} color={c} h={10} /></View>
            <Text style={{ width: 46, textAlign: "right", fontFamily: F.bodyHeavy, color: th.muted, fontVariant: ["tabular-nums"] }}>{p}%</Text>
          </View>); })}
      </View>

      <KilimRule color={th.line2} accent={th.zer} h={10} seed={19} />

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <H2>{t("thisWeek")}</H2>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 18, borderTopWidth: 2, borderStyle: "dashed", borderColor: th.zer }} />
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, color: th.zerDeep }}>{t("goalLine", { n: s.goal })}</Text>
          </View>
        </View>
        <Week />
        {Object.keys(s.xpLog).filter((d) => d >= dayAdd(day(), -6)).every((d) => !s.xpLog[d]) ? <Text style={{ fontFamily: F.body, fontSize: TS.sm, color: th.muted, textAlign: "center" }}>{t("weekEmpty")}</Text> : null}
      </View>

      <View style={{ gap: 4 }}>
        <H2>{t("badges")}</H2>
        {BADGES.map(([k, f, max], i) => { const v = f(s), got = v >= max, [nm, ds] = t2(k); return (
          <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: th.line }}>
            <View style={{ width: 46, height: 46, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", width: 32, height: 32, borderRadius: 7, transform: [{ rotate: "45deg" }], backgroundColor: got ? th.zer : "transparent", borderWidth: got ? 0 : 1.5, borderColor: th.line2 }} />
              <View>{got ? <Icon.trophy size={20} color="#2E1F00" /> : <Diamond size={8} color={th.line2} />}</View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.serif, fontSize: TS.md + 1, color: got ? th.ink : th.muted }}>{nm}</Text>
              <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.muted }}>{ds}</Text>
              {!got ? <View style={{ marginTop: 6 }}><Meter pct={(Math.min(v, max) / max) * 100} h={6} color={th.zer} /></View> : null}
            </View>
            {got ? <Icon.check size={20} color={th.keskDeep} /> : <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.xs, color: th.muted, fontVariant: ["tabular-nums"] }}>{Math.min(v, max)}/{max}</Text>}
          </View>); })}
      </View>
      <Btn title={t("settings")} kind="ghost" icon={<Icon.gear size={20} color={th.ink} />} onPress={() => router.push("/settings")} />
    </ScrollView>
  );
}
