import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { speak, sfx } from "@/lib/audio";
import { NODES, SECTIONS, UNIQUE, UNIT, UNITS, type NodeT, type Unit } from "@/lib/course";
import { M, t, up, kuUp } from "@/lib/i18n";
import { nodeTitle } from "@/lib/nodes";
import { firstOpen, isDone, unlocked, update, useS } from "@/lib/store";
import { Chest, Kew } from "@/ui/art";
import { Icon } from "@/ui/icons";
import { Btn, confetti, Sheet, Spk, toast } from "@/ui/kit";
import { F, shade, useTheme } from "@/ui/theme";

type Row =
  | { k: "lvl"; lvl: string } | { k: "sec"; si: number }
  | { k: "unit"; u: Unit; ui: number; first: boolean } | { k: "node"; n: NodeT; off: number } | { k: "end" };
/* Fixed row heights let the list jump straight to the current lesson. */
const H = { lvl: 110, sec: 84, unit: 76, node: 104, end: 230 } as const;
const OFFS = [0, -54, -80, -54, 0, 54, 80, 54];
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
    if (!unlocked(n.id)) { sfx("bad"); toast(t("lockedFirst")); return; }
    if (n.type === "chest") {
      if (isDone(n.id)) return toast(t("chestDone"));
      const g = chestGems();
      update((x) => { x.gems += g; x.done[n.id] = true; }); sfx("chest"); confetti();
      return setSheet({ type: "chest", id: n.id, gems: g });
    }
    setSheet({ type: "node", id: n.id });
  };

  const render = ({ item: r }: { item: Row }) => {
    if (r.k === "lvl") {
      const c = r.lvl === "A1" ? th.kesk : th.sky;
      return (
        <View style={{ height: H.lvl, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: c, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontFamily: F.display, fontSize: 20 }}>{r.lvl}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: th.ink, fontFamily: F.bodyHeavy, fontSize: 16 }}>{t("levelStart", { l: r.lvl })}</Text>
              <Text numberOfLines={2} style={{ color: th.muted, fontFamily: F.body, fontSize: 13 }}>{t("level" + r.lvl)}</Text>
            </View>
          </View>
        </View>
      );
    }
    if (r.k === "sec") {
      const sec = SECTIONS[r.si]; const sn = NODES.filter((n) => UNIT[n.unit].si === r.si); const sd = sn.filter((n) => s.done[n.id]).length;
      return (
        <View style={{ height: H.sec, justifyContent: "center", alignItems: "center", gap: 2 }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: 13, letterSpacing: 1.6, color: th.faint }}>{up(t("section"))} {r.si + 1} · {sd}/{sn.length}</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.display, fontSize: 22, color: th.ink }}>{M(sec.name)}</Text>
        </View>
      );
    }
    if (r.k === "unit") {
      if (r.first) return <View style={{ height: H.unit }} />;
      return (
        <View style={{ height: H.unit, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 2, backgroundColor: th.line }} />
          <Text numberOfLines={1} style={{ maxWidth: "70%", fontFamily: F.bodyHeavy, fontSize: 16, color: th.muted }}>{r.u.ku} · {M(r.u.name)}</Text>
          <View style={{ flex: 1, height: 2, backgroundColor: th.line }} />
        </View>
      );
    }
    if (r.k === "node") return <PathNode n={r.n} off={r.off} cur={cur?.id === r.n.id} onPress={() => openNode(r.n)} />;
    return (
      <View style={{ height: H.end, alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Kew size={90} />
        <Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center", maxWidth: 300 }}>{t("pathEnd", { u: UNITS.length, n: NODES.length, w: UNIQUE })}</Text>
      </View>
    );
  };

  const bu = UNIT[topUnit]; const bnodes = NODES.filter((n) => n.unit === bu.id);
  const bOpen = unlocked(bnodes[0].id, s), bDone = bnodes.filter((n) => s.done[n.id]).length, bJump = !bOpen && UNITS.indexOf(bu) > 0;
  const bCol = bOpen ? bu.col : th.lockedDeep;
  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <FlatList ref={list} data={ROWS} renderItem={render} keyExtractor={(r, i) => r.k + i} extraData={s}
        getItemLayout={(_, i) => ({ ...OFFSETS[i], index: i })}
        onScroll={(e) => { const id = unitAt(e.nativeEvent.contentOffset.y); if (id !== topUnit) setTopUnit(id); }} scrollEventThrottle={64}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: BANNER + 4, paddingBottom: 30, maxWidth: 560, width: "100%", alignSelf: "center" }}
        initialNumToRender={20} windowSize={9} />
      {/* sticky unit banner, as in the reference apps: always shows the unit under the reader's thumb */}
      <View style={{ position: "absolute", top: 8, left: 0, right: 0, paddingHorizontal: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ height: BANNER - 12, flexDirection: "row", alignItems: "stretch", borderRadius: 16, backgroundColor: bCol, borderBottomWidth: 4, borderColor: shade(bOpen ? bu.col : "#9aa79a", 0.75), overflow: "hidden" }}>
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.2 }}>{SECTIONS[bu.si].lvl} · {up(t("unit"))} {UNITS.indexOf(bu) + 1} · {bDone}/{bnodes.length}</Text>
            <Text numberOfLines={1} style={{ color: "#fff", fontFamily: F.display, fontSize: 21, lineHeight: 27 }}>{bu.ku} · <Text style={{ fontFamily: F.body, fontSize: 16 }}>{M(bu.name)}</Text></Text>
          </View>
          <Pressable onPress={() => { sfx("tap"); setSheet({ type: bJump ? "jump" : "guide", id: bu.id }); }} accessibilityRole="button" accessibilityLabel={bJump ? t("jump") : t("guide")}
            style={({ pressed }) => ({ width: 64, alignItems: "center", justifyContent: "center", borderLeftWidth: 2, borderColor: "rgba(0,0,0,0.15)", backgroundColor: pressed ? "rgba(0,0,0,0.08)" : "transparent" })}>
            {bJump ? <Icon.jump size={26} /> : <Icon.book size={26} />}
          </Pressable>
        </View>
      </View>
      <NodeSheets sheet={sheet} close={() => setSheet(null)} />
    </View>
  );
}

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const th = useTheme(); const r = 46, c = 2 * Math.PI * r;
  return (
    <Svg width={100} height={100} style={{ position: "absolute", top: -12, left: -13 }} pointerEvents="none">
      <Circle cx={50} cy={50} r={r} stroke={th.line} strokeWidth={8} fill="none" />
      <Circle cx={50} cy={50} r={r} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${(c * Math.max(0.04, pct)).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 50 50)" />
    </Svg>
  );
}

function PathNode({ n, off, cur, onPress }: { n: NodeT; off: number; cur: boolean; onPress: () => void }) {
  const th = useTheme(); const s = useS(); const u = UNIT[n.unit];
  const dn = isDone(n.id, s), un = unlocked(n.id, s);
  const bob = useSharedValue(0);
  useEffect(() => { bob.value = cur ? withRepeat(withSequence(withTiming(-5, { duration: 650 }), withTiming(0, { duration: 650 })), -1) : 0; }, [cur, bob]);
  const tip = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const label = `${u.ku}: ${nodeTitle(n)}`;
  if (n.type === "chest") return (
    <View style={{ height: H.node, alignItems: "center", justifyContent: "center" }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ transform: [{ translateX: off }] }}><Chest size={78} open={dn} lock={!un} /></Pressable>
    </View>
  );
  const c = dn ? th.zer : un ? u.col : th.locked;
  const Ic = dn ? Icon.check : !un ? Icon.lock : n.type === "story" ? Icon.story : n.type === "sent" ? Icon.chat : Icon.star;
  const unitNodes = NODES.filter((x) => x.unit === n.unit); const unitPct = unitNodes.filter((x) => s.done[x.id]).length / unitNodes.length;
  return (
    <View style={{ height: H.node, alignItems: "center", justifyContent: "center" }}>
      <View style={{ transform: [{ translateX: off }] }}>
        {cur && <Animated.View style={[{ position: "absolute", top: -62, alignSelf: "center", alignItems: "center", zIndex: 2 }, tip]} pointerEvents="none">
          <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: th.surface, borderWidth: 2, borderColor: th.line }}>
            <Text style={{ fontFamily: F.bodyHeavy, color: u.col, fontSize: 14, letterSpacing: 0.8 }}>{up(t("start"))}</Text>
          </View>
          <View style={{ width: 12, height: 12, marginTop: -7, backgroundColor: th.surface, borderRightWidth: 2, borderBottomWidth: 2, borderColor: th.line, transform: [{ rotate: "45deg" }] }} />
        </Animated.View>}
        {cur && <ProgressRing pct={unitPct} color={u.col} />}
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
          style={({ pressed }) => ({ width: 74, height: 68, borderRadius: 37, backgroundColor: c, alignItems: "center", justifyContent: "center", borderBottomWidth: pressed ? 2 : 8, marginTop: pressed ? 6 : 0, borderColor: dn ? th.zerDeep : un ? shade(u.col, 0.72) : th.line2 })}>
          <Ic size={30} color={!un ? th.lockedDeep : "#fff"} />
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
        <Text style={{ fontFamily: F.display, fontSize: 26, color: th.ink, textAlign: "center" }}>{t("gemsWon", { n: sheet.gems! })}</Text>
        <Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center" }}>{t("chestText")}</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 12, borderRadius: 16, backgroundColor: u.col + "22" }}>
          <Kew size={56} />
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{t("unitDone", { u: u.ku })}</Text><Text style={{ fontFamily: F.body, color: th.muted, fontSize: 13 }}>{t("unitDoneText")}</Text></View>
        </View>
        <Btn title={t("cont")} onPress={close} />
      </Sheet>
    );
  }
  if (sheet.type === "node") {
    const n = NODES.find((x) => x.id === sheet.id)!; const u = UNIT[n.unit]; const xp = n.type === "story" ? 15 : 10;
    const desc = n.type === "learn" ? u.words.slice(...n.range!).map((w) => w[0]).join(" · ") : n.type === "sent" ? t("descSent") : t("descStory");
    return (
      <Sheet visible onClose={close} tint={u.col}>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.4 }}>{kuUp(u.ku)} · {up(M(u.name))}</Text>
        <Text style={{ color: "#fff", fontFamily: F.display, fontSize: 28 }}>{nodeTitle(n)}</Text>
        <Text style={{ color: "#fff", fontFamily: F.body, fontSize: 16 }}>{desc}</Text>
        <Btn title={`${isDone(n.id) ? t("again") : t("start")} · +${xp} XP`} kind="ghost" onPress={() => { close(); router.push(n.type === "story" ? { pathname: "/story", params: { node: n.id } } : { pathname: "/lesson", params: { node: n.id } }); }} />
      </Sheet>
    );
  }
  const u = UNIT[sheet.id];
  if (sheet.type === "jump") return (
    <Sheet visible center onClose={close}>
      <View style={{ alignItems: "center" }}><Icon.jump size={64} color={u.col} /></View>
      <Text style={{ fontFamily: F.display, fontSize: 24, color: th.ink, textAlign: "center" }}>{t("jumpTitle", { u: u.ku })}</Text>
      <Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center" }}>{t("jumpText")}</Text>
      <Btn title={t("startTest")} onPress={() => { close(); router.push({ pathname: "/lesson", params: { jump: u.id } }); }} />
      <Btn title={t("close")} kind="ghost" onPress={close} />
    </Sheet>
  );
  const letters = [["ê", "e"], ["e", "e / ä"], ["î", "i"], ["i", "ı"], ["û", "uː"], ["x", "χ"], ["q", "q"], ["w", "w"]];
  return (
    <Sheet visible onClose={close}>
      <ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.4, color: th.muted }}>{up(t("guide"))} · {up(M(u.name))}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 28, color: th.ink }}>{u.ku}</Text>
        {u.id === "silav" && <>
          <Text style={{ fontFamily: F.body, color: th.muted }}>{t("guideAlpha")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {letters.map(([a, b]) => <Pressable key={a} onPress={() => speak(a)} style={{ width: 64, alignItems: "center", padding: 8, borderRadius: 12, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface }}>
              <Text style={{ fontFamily: F.display, fontSize: 22, color: th.ink }}>{a}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{b}</Text></Pressable>)}
          </View></>}
        {(u.tips || []).map(([k, v]) => (
          <View key={k} style={{ padding: 12, borderRadius: 14, backgroundColor: th.bg, gap: 2 }}>
            <Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{k.includes("|") ? M(k) : k}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{M(v)}</Text>
          </View>))}
        {u.note ? <Text style={{ fontFamily: F.body, color: th.ink, lineHeight: 22 }}>{M(u.note)}</Text> : null}
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.4, color: th.muted }}>{up(t("keyPhrases"))}</Text>
        {u.sents.map(([k, m]) => (
          <View key={k} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Spk text={k} size={40} />
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{k}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{M(m)}</Text></View>
          </View>))}
      </ScrollView>
      <Btn title={t("gotIt")} onPress={close} />
    </Sheet>
  );
}
