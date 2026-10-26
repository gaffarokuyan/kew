import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { speak, sfx } from "@/lib/audio";
import { NODES, SECTIONS, UNIQUE, UNIT, UNITS, type Level, type NodeT, type Unit } from "@/lib/course";
import { M, t } from "@/lib/i18n";
import { nodeTitle } from "@/lib/nodes";
import { firstOpen, isDone, unlocked, update, useS } from "@/lib/store";
import { Chest, Diamond, Kew, KilimRule, Medallion } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti, Sheet, Spk, toast } from "@/ui/kit";
import { alpha, F, levelCol, shade, TS, ucol, useTheme } from "@/ui/theme";

type Row =
  | { k: "lvl"; lvl: Level } | { k: "sec"; si: number }
  | { k: "unit"; u: Unit; ui: number; first: boolean } | { k: "node"; n: NodeT; off: number } | { k: "end" };
/* Fixed row heights let the list jump straight to the current lesson. */
const H = { lvl: 172, sec: 96, unit: 72, node: 108, end: 250 } as const;
const OFFS = [0, -50, -76, -50, 0, 50, 76, 50];
const BANNER = 84;

function buildRows(): Row[] {
  const rows: Row[] = []; let k = 0;
  SECTIONS.forEach((sec, si) => {
    if (si === 0 || SECTIONS[si - 1].lvl !== sec.lvl) rows.push({ k: "lvl", lvl: sec.lvl });
    rows.push({ k: "sec", si });
    sec.units.forEach((u0, j) => {
      const ui = UNITS.findIndex((x) => x.id === u0.id); const u = UNITS[ui];
      rows.push({ k: "unit", u, ui, first: si === 0 && j === 0 }); k = 0;
      NODES.filter((n) => n.unit === u.id).forEach((n) => rows.push({ k: "node", n, off: OFFS[k++ % OFFS.length] }));
    });
  });
  rows.push({ k: "end" });
  return rows;
}

const ROWS = buildRows();
const OFFSETS = (() => { let y = 0; return ROWS.map((r) => { const o = { length: H[r.k], offset: y }; y += H[r.k]; return o; }); })();
const chestGems = () => 20 + Math.floor(Math.random() * 4) * 5;
/** Unit whose rows sit under the sticky banner at a given scroll offset. */
function unitAt(y: number) {
  let id = UNITS[0].id;
  for (let i = 0; i < ROWS.length; i++) { if (OFFSETS[i].offset > y + 40) break; const r = ROWS[i]; if (r.k === "unit") id = r.u.id; }
  return id;
}

export default function Learn() {
  const th = useTheme(); const s = useS();
  const list = useRef<FlatList<Row>>(null);
  const [sheet, setSheet] = useState<null | { type: "node" | "chest" | "guide" | "jump"; id: string; gems?: number }>(null);
  const [topUnit, setTopUnit] = useState(UNITS[0].id);
  const cur = firstOpen(s);

  useFocusEffect(useCallback(() => {
    const target = firstOpen();
    const i = ROWS.findIndex((r) => r.k === "node" && r.n.id === target?.id);
    if (i > 2) setTimeout(() => list.current?.scrollToOffset({ offset: Math.max(0, OFFSETS[i].offset - 300), animated: false }), 30);
  }, []));

  const openNode = (n: NodeT) => {
    if (!unlocked(n.id)) { sfx("bad"); buzz("bad"); toast(t("lockedFirst")); return; }
    if (n.type === "chest") {
      if (isDone(n.id)) return toast(t("chestDone"));
      const g = chestGems();
      update((x) => { x.gems += g; x.done[n.id] = true; }); sfx("chest"); buzz("win"); confetti();
      return setSheet({ type: "chest", id: n.id, gems: g });
    }
    buzz("tap"); setSheet({ type: "node", id: n.id });
  };

  const render = ({ item: r }: { item: Row }) => {
    if (r.k === "lvl") {
      const c = levelCol(r.lvl, th);
      return (
        <View style={{ height: H.lvl, justifyContent: "center", gap: 14 }} accessible accessibilityRole="header" accessibilityLabel={`${t("levelStart", { l: r.lvl })}. ${t("level" + r.lvl)}`}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute" }}><Medallion size={84} color={c} accent={c} core={false} seed={r.lvl.charCodeAt(1)} /></View>
              <Text style={{ fontFamily: F.display, fontSize: 25, lineHeight: 30, color: c }}>{r.lvl}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.display, fontSize: TS.xl - 2, lineHeight: 28, color: th.ink }}>{t("levelStart", { l: r.lvl })}</Text>
              <Text numberOfLines={2} style={{ color: th.muted, fontFamily: F.bodySemi, fontSize: 14, lineHeight: 19 }}>{t("level" + r.lvl)}</Text>
            </View>
          </View>
          <KilimRule color={c} h={12} seed={r.lvl.charCodeAt(0) + r.lvl.charCodeAt(1)} />
        </View>
      );
    }
    if (r.k === "sec") {
      const sec = SECTIONS[r.si]; const sn = NODES.filter((n) => UNIT[n.unit].si === r.si); const sd = sn.filter((n) => s.done[n.id]).length;
      return (
        <View style={{ height: H.sec, justifyContent: "center", alignItems: "center", gap: 0 }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.xs, color: th.muted }}>{t("section")} {r.si + 1}<Text style={{ fontFamily: F.body, color: th.faint }}>{"   "}{sd}/{sn.length}</Text></Text>
          <Text numberOfLines={1} accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl + 2, lineHeight: 34, color: th.ink }}>{M(sec.name)}</Text>
        </View>
      );
    }
    if (r.k === "unit") {
      if (r.first) return <View style={{ height: H.unit }} />;
      const c = ucol(r.u.col, th);
      return (
        <View style={{ height: H.unit, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: th.line2 }} />
          <Diamond size={9} color={c} />
          <Text numberOfLines={1} style={{ maxWidth: "70%", fontFamily: F.italicBold, fontSize: TS.md + 1, color: th.ink }}>{r.u.ku}<Text style={{ fontFamily: F.body, fontSize: TS.sm, color: th.muted }}>{"  "}{M(r.u.name)}</Text></Text>
          <Diamond size={9} color={c} />
          <View style={{ flex: 1, height: 1, backgroundColor: th.line2 }} />
        </View>
      );
    }
    if (r.k === "node") return <PathNode n={r.n} off={r.off} cur={cur?.id === r.n.id} onPress={() => openNode(r.n)} />;
    return (
      <View style={{ height: H.end, alignItems: "center", justifyContent: "center", gap: 10 }}>
        <KilimRule color={th.zer} h={10} seed={41} style={{ width: 160, alignSelf: "center" }} />
        <Kew size={96} />
        <Text style={{ fontFamily: F.italic, fontSize: TS.md, lineHeight: 24, color: th.muted, textAlign: "center", maxWidth: 320 }}>{t("pathEnd", { u: UNITS.length, n: NODES.length, w: UNIQUE })}</Text>
      </View>
    );
  };

  const bu = UNIT[topUnit]; const bnodes = NODES.filter((n) => n.unit === bu.id);
  const bOpen = unlocked(bnodes[0].id, s), bDone = bnodes.filter((n) => s.done[n.id]).length, bJump = !bOpen && UNITS.indexOf(bu) > 0;
  const bCol = bOpen ? ucol(bu.col, th) : th.lockedDeep;
  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <FlatList ref={list} data={ROWS} renderItem={render} keyExtractor={(r, i) => r.k + i} extraData={s}
        getItemLayout={(_, i) => ({ ...OFFSETS[i], index: i })}
        onScroll={(e) => { const id = unitAt(e.nativeEvent.contentOffset.y); if (id !== topUnit) setTopUnit(id); }} scrollEventThrottle={64}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: BANNER + 4, paddingBottom: 30, maxWidth: 560, width: "100%", alignSelf: "center" }}
        initialNumToRender={20} windowSize={9} />
      {/* sticky unit banner, as in the reference apps: always shows the unit under the reader's thumb */}
      <View style={{ position: "absolute", top: 8, left: 0, right: 0, paddingHorizontal: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ height: BANNER - 12, flexDirection: "row", alignItems: "stretch", borderRadius: 14, borderTopLeftRadius: 6, backgroundColor: bCol, borderBottomWidth: 4, borderColor: shade(bCol, 0.7), overflow: "hidden" }}>
          <KilimRule color="rgba(255,255,255,0.22)" h={9} lines={false} seed={UNITS.indexOf(bu) + 5} style={{ position: "absolute", left: 10, right: 72, bottom: 4 }} />
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16, paddingBottom: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.88)", fontFamily: F.bodyHeavy, fontSize: TS.xs }}>{SECTIONS[bu.si].lvl} · {t("unit")} {UNITS.indexOf(bu) + 1}{"   "}<Text style={{ fontFamily: F.body }}>{bDone}/{bnodes.length}</Text></Text>
            <Text numberOfLines={1} style={{ color: "#fff", fontFamily: F.display, fontSize: 23, lineHeight: 28 }}>{bu.ku}<Text style={{ fontFamily: F.bodySemi, fontSize: TS.sm }}>{"  "}{M(bu.name)}</Text></Text>
          </View>
          <Pressable onPress={() => { sfx("tap"); buzz("tap"); setSheet({ type: bJump ? "jump" : "guide", id: bu.id }); }} accessibilityRole="button" accessibilityLabel={bJump ? t("jump") : t("guide")}
            style={({ pressed }) => ({ width: 64, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderColor: "rgba(255,255,255,0.25)", backgroundColor: pressed ? "rgba(0,0,0,0.12)" : "transparent" })}>
            {bJump ? <Icon.jump size={26} /> : <Icon.book size={26} />}
          </Pressable>
        </View>
      </View>
      <NodeSheets sheet={sheet} close={() => setSheet(null)} />
    </View>
  );
}

/** Progress around the current stop, traced along a lozenge instead of a circle. */
function ProgressLozenge({ pct, color }: { pct: number; color: string }) {
  const th = useTheme(); const R = 56, c = 60, per = 4 * Math.SQRT2 * R;
  const d = `M${c} ${c - R} L${c + R} ${c} L${c} ${c + R} L${c - R} ${c}Z`;
  return (
    <Svg width={120} height={120} style={{ position: "absolute", top: -16, left: -16 }} pointerEvents="none">
      <Path d={d} stroke={th.line} strokeWidth={6} fill="none" strokeLinejoin="round" />
      <Path d={d} stroke={color} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${(per * Math.max(0.03, pct)).toFixed(1)} ${per.toFixed(1)}`} />
    </Svg>
  );
}

function PathNode({ n, off, cur, onPress }: { n: NodeT; off: number; cur: boolean; onPress: () => void }) {
  const th = useTheme(); const s = useS(); const u = UNIT[n.unit];
  const dn = isDone(n.id, s), un = unlocked(n.id, s);
  const bob = useSharedValue(0);
  useEffect(() => { bob.value = cur ? withRepeat(withSequence(withTiming(off > 0 ? 4 : -4, { duration: 650 }), withTiming(0, { duration: 650 })), -1) : 0; }, [cur, bob, off]);
  const tip = useAnimatedStyle(() => ({ transform: [{ translateX: bob.value }] }));
  const label = `${u.ku}: ${nodeTitle(n)}`;
  if (n.type === "chest") return (
    <View style={{ height: H.node, alignItems: "center", justifyContent: "center" }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ transform: [{ translateX: off }] }}><Chest size={78} open={dn} lock={!un} /></Pressable>
    </View>
  );
  const uc = ucol(u.col, th);
  const c = dn ? th.zer : un ? uc : th.locked;
  const lip = dn ? shade(th.zer, 0.72) : un ? shade(uc, 0.66) : th.line2;
  const Ic = dn ? Icon.check : !un ? Icon.lock : n.type === "story" ? Icon.story : n.type === "sent" ? Icon.chat : Icon.star;
  const unitNodes = NODES.filter((x) => x.unit === n.unit); const unitPct = unitNodes.filter((x) => s.done[x.id]).length / unitNodes.length;
  const sq = 60; // side of the lozenge before rotation; its diagonal is ~85px
  return (
    <View style={{ height: H.node, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 88, height: 88, transform: [{ translateX: off }] }}>
        {/* "Start" flag sits beside the stop, on the side with more room, so it never covers a unit heading. */}
        {cur && <Animated.View style={[{ position: "absolute", top: 28, flexDirection: off > 0 ? "row-reverse" : "row", alignItems: "center", zIndex: 2 }, off > 0 ? { right: 88 + 12 } : { left: 88 + 12 }, tip]} pointerEvents="none">
          <View style={{ width: 10, height: 10, backgroundColor: th.ink, transform: [{ rotate: "45deg" }], [off > 0 ? "marginLeft" : "marginRight"]: -6 }} />
          <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: th.ink }}>
            <Text style={{ fontFamily: F.bodyHeavy, color: th.bg, fontSize: TS.sm }}>{t("start")}</Text>
          </View>
        </Animated.View>}
        {cur && <ProgressLozenge pct={unitPct} color={uc} />}
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !un, checked: dn }}
          style={{ width: 88, height: 88, alignItems: "center", justifyContent: "center" }}>
          {({ pressed }) => (<>
            <View style={{ position: "absolute", top: 14 + 6, left: 14, width: sq, height: sq, borderRadius: 13, backgroundColor: lip, transform: [{ rotate: "45deg" }] }} />
            <View style={{ position: "absolute", top: 14 + (pressed ? 5 : 0), left: 14, width: sq, height: sq, borderRadius: 13, backgroundColor: c, transform: [{ rotate: "45deg" }] }} />
            <View style={{ marginTop: pressed ? 5 : 0 }}><Ic size={28} color={!un ? th.lockedDeep : "#fff"} /></View>
          </>)}
        </Pressable>
      </View>
    </View>
  );
}

function NodeSheets({ sheet, close }: { sheet: null | { type: string; id: string; gems?: number }; close: () => void }) {
  const th = useTheme();
  if (!sheet) return null;
  if (sheet.type === "chest") {
    const u = UNIT[sheet.id.split(":")[0]];
    return (
      <Sheet visible center onClose={close}>
        <View style={{ alignItems: "center" }}><Chest size={140} open /></View>
        <Text style={{ fontFamily: F.display, fontSize: TS.xl + 2, color: th.ink, textAlign: "center" }}>{t("gemsWon", { n: sheet.gems! })}</Text>
        <Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center" }}>{t("chestText")}</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 12, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: alpha(ucol(u.col, th), 0.13) }}>
          <Kew size={56} />
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.serif, fontSize: TS.md + 1, color: th.ink }}>{t("unitDone", { u: u.ku })}</Text><Text style={{ fontFamily: F.body, color: th.muted, fontSize: 13 }}>{t("unitDoneText")}</Text></View>
        </View>
        <Btn title={t("cont")} onPress={close} />
      </Sheet>
    );
  }
  if (sheet.type === "node") {
    const n = NODES.find((x) => x.id === sheet.id)!; const u = UNIT[n.unit]; const xp = n.type === "story" ? 15 : 10;
    const desc = n.type === "learn" ? u.words.slice(...n.range!).map((w) => w[0]).join(" · ") : n.type === "sent" ? t("descSent") : t("descStory");
    return (
      <Sheet visible onClose={close} tint={ucol(u.col, th)}>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontFamily: F.italic, fontSize: TS.md }}>{u.ku}, {M(u.name)}</Text>
        <Text style={{ color: "#fff", fontFamily: F.display, fontSize: TS.xxl, lineHeight: 38 }}>{nodeTitle(n)}</Text>
        <Text style={{ color: "#fff", fontFamily: n.type === "learn" ? F.serif : F.bodySemi, fontSize: n.type === "learn" ? TS.lg : TS.md, lineHeight: 26 }}>{desc}</Text>
        <KilimRule color="rgba(255,255,255,0.35)" h={10} seed={n.ui + 11} />
        <Btn title={`${isDone(n.id) ? t("again") : t("start")} · +${xp} XP`} kind="ghost" onPress={() => { close(); router.push(n.type === "story" ? { pathname: "/story", params: { node: n.id } } : { pathname: "/lesson", params: { node: n.id } }); }} />
      </Sheet>
    );
  }
  const u = UNIT[sheet.id];
  if (sheet.type === "jump") return (
    <Sheet visible center onClose={close}>
      <View style={{ alignItems: "center" }}><Icon.jump size={64} color={ucol(u.col, th)} /></View>
      <Text style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink, textAlign: "center" }}>{t("jumpTitle", { u: u.ku })}</Text>
      <Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center" }}>{t("jumpText")}</Text>
      <Btn title={t("startTest")} onPress={() => { close(); router.push({ pathname: "/lesson", params: { jump: u.id } }); }} />
      <Btn title={t("close")} kind="ghost" onPress={close} />
    </Sheet>
  );
  const letters = [["ê", "e"], ["e", "e / ä"], ["î", "i"], ["i", "ı"], ["û", "uː"], ["x", "χ"], ["q", "q"], ["w", "w"]];
  return (
    <Sheet visible onClose={close}>
      <ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: F.italic, fontSize: TS.md, color: th.muted }}>{t("guide")}, {M(u.name)}</Text>
        <Text style={{ fontFamily: F.display, fontSize: TS.xxl, lineHeight: 38, color: th.ink }}>{u.ku}</Text>
        <KilimRule color={ucol(u.col, th)} h={10} seed={7} />
        {u.id === "silav" && <>
          <Text style={{ fontFamily: F.body, color: th.muted }}>{t("guideAlpha")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {letters.map(([a, b]) => <Pressable key={a} onPress={() => speak(a)} accessibilityRole="button" accessibilityLabel={a} style={{ width: 64, minHeight: 56, alignItems: "center", padding: 6, borderRadius: 10, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>
              <Text style={{ fontFamily: F.display, fontSize: 24, lineHeight: 28, color: th.ink }}>{a}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{b}</Text></Pressable>)}
          </View></>}
        {(u.tips || []).map(([k, v]) => (
          <View key={k} style={{ paddingVertical: 10, paddingLeft: 14, borderLeftWidth: 3, borderColor: th.zer, gap: 2 }}>
            <Text style={{ fontFamily: F.serif, fontSize: TS.md + 1, color: th.ink }}>{k.includes("|") ? M(k) : k}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{M(v)}</Text>
          </View>))}
        {u.note ? <Text style={{ fontFamily: F.bodySemi, color: th.ink, lineHeight: 23 }}>{M(u.note)}</Text> : null}
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.lg, color: th.ink, marginTop: 6 }}>{t("keyPhrases")}</Text>
        {u.sents.map(([k, m]) => (
          <View key={k} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Spk text={k} size={40} />
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.serif, fontSize: TS.md + 1, color: th.ink }}>{k}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{M(m)}</Text></View>
          </View>))}
      </ScrollView>
      <Btn title={t("gotIt")} onPress={close} />
    </Sheet>
  );
}
