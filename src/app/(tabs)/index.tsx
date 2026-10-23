import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { speak, sfx } from "@/lib/audio";
import { NODES, SAYINGS, SECTIONS, UNIQUE, UNIT, UNITS, type NodeT, type Unit } from "@/lib/course";
import { M, t, up, kuUp } from "@/lib/i18n";
import { nodeTitle } from "@/lib/nodes";
import { day, firstOpen, isDone, unlocked, update, useS } from "@/lib/store";
import { Chest, Kew } from "@/ui/art";
import { Icon } from "@/ui/icons";
import { Btn, confetti, Meter, Sheet, Spk, toast } from "@/ui/kit";
import { F, shade, useTheme } from "@/ui/theme";

type Row =
  | { k: "goal" } | { k: "saying" } | { k: "lvl"; lvl: string } | { k: "sec"; si: number }
  | { k: "unit"; u: Unit; ui: number } | { k: "node"; n: NodeT; off: number } | { k: "end" };
const H = { goal: 80, saying: 108, lvl: 104, sec: 96, unit: 124, node: 98, end: 230 } as const;
const OFFS = [0, -58, -88, -58, 0, 58, 88, 58];


function buildRows(): Row[] {
  const rows: Row[] = [{ k: "goal" }, { k: "saying" }]; let k = 0;
  SECTIONS.forEach((sec, si) => {
    if (si === 0 || SECTIONS[si - 1].lvl !== sec.lvl) rows.push({ k: "lvl", lvl: sec.lvl });
    rows.push({ k: "sec", si });
    sec.units.forEach((u0) => {
      const ui = UNITS.findIndex((x) => x.id === u0.id); const u = UNITS[ui];
      rows.push({ k: "unit", u, ui });
      NODES.filter((n) => n.unit === u.id).forEach((n) => rows.push({ k: "node", n, off: OFFS[k++ % OFFS.length] }));
    });
  });
  rows.push({ k: "end" });
  return rows;
}

const ROWS = buildRows();
const OFFSETS = (() => { let y = 0; return ROWS.map((r) => { const o = { length: H[r.k], offset: y }; y += H[r.k]; return o; }); })();
const chestGems = () => 20 + Math.floor(Math.random() * 4) * 5;

export default function Learn() {
  const th = useTheme(); const s = useS();
  const rows = ROWS, offsets = OFFSETS;
  const list = useRef<FlatList<Row>>(null);
  const [sheet, setSheet] = useState<null | { type: "node" | "chest" | "guide" | "jump"; id: string; gems?: number }>(null);
  const cur = firstOpen(s);

  useFocusEffect(useCallback(() => {
    const target = firstOpen();
    const i = rows.findIndex((r) => r.k === "node" && r.n.id === target?.id);
    if (i > 2) setTimeout(() => list.current?.scrollToOffset({ offset: Math.max(0, offsets[i].offset - 260), animated: false }), 30);
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
    if (r.k === "goal") {
      const pct = Math.min(100, Math.round((s.daily.xp / s.goal) * 100));
      return (
        <View style={{ height: H.goal, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: th.surface, borderWidth: 2, borderColor: th.line }}>
            <Icon.target size={34} color={th.zer} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{t("dailyGoal")}: {s.daily.xp} / {s.goal} XP</Text>
              <Meter pct={pct} />
            </View>
          </View>
        </View>
      );
    }
    if (r.k === "saying") {
      const n = Math.floor(new Date(day() + "T12:00").getTime() / 864e5) % SAYINGS.length; const [k, m] = SAYINGS[n];
      return (
        <View style={{ height: H.saying, justifyContent: "center" }}>
          <Pressable onPress={() => speak(k)} style={{ padding: 12, borderRadius: 16, backgroundColor: th.zerSoft, borderWidth: 2, borderColor: th.zer + "66", gap: 4 }}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 1.6, color: th.muted }}>{t("saying")}</Text>
            <Text numberOfLines={2} style={{ fontFamily: F.bodyHeavy, fontSize: 16, color: th.ink }}>{k}</Text>
            <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 14, color: th.muted }}>{M(m)}</Text>
          </Pressable>
        </View>
      );
    }
    if (r.k === "lvl") {
      const c = r.lvl === "A1" ? "#1f8a4c" : "#1c8fc7";
      return (
        <View style={{ height: H.lvl, justifyContent: "flex-end", paddingBottom: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, backgroundColor: c }}>
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontFamily: F.display, fontSize: 22 }}>{r.lvl}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontFamily: F.bodyHeavy, fontSize: 16 }}>{t("levelStart", { l: r.lvl })}</Text>
              <Text numberOfLines={2} style={{ color: "rgba(255,255,255,0.9)", fontFamily: F.body, fontSize: 13 }}>{t("level" + r.lvl)}</Text>
            </View>
          </View>
        </View>
      );
    }
    if (r.k === "sec") {
      const sec = SECTIONS[r.si]; const sn = NODES.filter((n) => UNIT[n.unit].si === r.si); const sd = sn.filter((n) => s.done[n.id]).length;
      return (
        <View style={{ height: H.sec, justifyContent: "center", alignItems: "center", gap: 2 }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 2, color: th.muted }}>{sec.lvl} · {up(t("section"))} {r.si + 1}</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.display, fontSize: 21, color: th.ink }}>{M(sec.name)}</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 13, color: th.faint }}>{sd}/{sn.length}</Text>
        </View>
      );
    }
    if (r.k === "unit") {
      const nodes = NODES.filter((n) => n.unit === r.u.id), open = unlocked(nodes[0].id, s), done = nodes.filter((n) => s.done[n.id]).length;
      const bg = open ? r.u.col : th.locked; const canJump = !open && r.ui > 0;
      return (
        <View style={{ height: H.unit, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 18, backgroundColor: bg, borderBottomWidth: 5, borderColor: shade(open ? r.u.col : "#9aa79a", 0.75) }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.2 }}>{up(t("unit"))} {r.ui + 1} · {done}/{nodes.length}</Text>
              <Text numberOfLines={1} style={{ color: "#fff", fontFamily: F.display, fontSize: 24, lineHeight: 30 }}>{r.u.ku}</Text>
              <Text numberOfLines={1} style={{ color: "rgba(255,255,255,0.92)", fontFamily: F.body }}>{M(r.u.name)}</Text>
            </View>
            <Pressable onPress={() => { sfx("tap"); setSheet({ type: canJump ? "jump" : "guide", id: r.u.id }); }} accessibilityRole="button"
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.45)" }}>
              {canJump ? <Icon.jump size={18} /> : <Icon.book size={18} />}
              <Text style={{ color: "#fff", fontFamily: F.bodyHeavy, fontSize: 13 }}>{canJump ? up(t("jump")) : up(t("guide"))}</Text>
            </Pressable>
          </View>
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

  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <FlatList ref={list} data={rows} renderItem={render} keyExtractor={(r, i) => r.k + i} extraData={s}
        getItemLayout={(_, i) => ({ ...offsets[i], index: i })} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, maxWidth: 560, width: "100%", alignSelf: "center" }}
        initialNumToRender={20} windowSize={9} />
      <NodeSheets sheet={sheet} close={() => setSheet(null)} />
    </View>
  );
}

function PathNode({ n, off, cur, onPress }: { n: NodeT; off: number; cur: boolean; onPress: () => void }) {
  const th = useTheme(); const s = useS(); const u = UNIT[n.unit];
  const dn = isDone(n.id, s), un = unlocked(n.id, s);
  const pulse = useSharedValue(1);
  useEffect(() => { pulse.value = cur ? withRepeat(withSequence(withTiming(1.06, { duration: 700 }), withTiming(1, { duration: 700 })), -1) : 1; }, [cur]);
  const ast = useAnimatedStyle(() => ({ transform: [{ scale: cur ? pulse.value : 1 }] }));
  const label = `${u.ku}: ${nodeTitle(n)}`;
  if (n.type === "chest") return (
    <View style={{ height: H.node, alignItems: "center", justifyContent: "center" }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ transform: [{ translateX: off }] }}><Chest size={78} open={dn} lock={!un} /></Pressable>
    </View>
  );
  const c = dn ? th.zer : un ? u.col : th.locked;
  const Ic = dn ? Icon.check : !un ? Icon.lock : n.type === "story" ? Icon.story : n.type === "sent" ? Icon.chat : Icon.star;
  return (
    <View style={{ height: H.node, alignItems: "center", justifyContent: "center" }}>
      <View style={{ transform: [{ translateX: off }] }}><Animated.View style={ast}>
        {cur && <View style={{ position: "absolute", top: -34, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: th.surface, borderWidth: 2, borderColor: th.line, zIndex: 2 }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: u.col, fontSize: 13, letterSpacing: 1 }}>{up(t("start"))}</Text></View>}
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
          style={({ pressed }) => ({ width: 74, height: 68, borderRadius: 37, backgroundColor: c, alignItems: "center", justifyContent: "center", borderBottomWidth: pressed ? 2 : 8, marginTop: pressed ? 6 : 0, borderColor: shade(dn ? "#f5b400" : un ? u.col : "#9aa79a", 0.72) })}>
          <Ic size={30} color={!un ? th.lockedDeep : "#fff"} />
        </Pressable>
      </Animated.View></View>
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
