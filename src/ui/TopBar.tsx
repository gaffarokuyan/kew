import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { t, tArr } from "@/lib/i18n";
import { day, dayAdd, HEART_MS, MAXH, update, useS } from "@/lib/store";
import { Diamond, Sun } from "./art";
import { Icon } from "./icons";
import { Btn, Sheet, toast } from "./kit";
import { F, TS, useTheme } from "./theme";

const minsToHeart = (h: number, at: number) => (h < MAXH ? Math.ceil((HEART_MS - (Date.now() - at)) / 6e4) : 0);

function Stat({ onPress, children, label }: { onPress: () => void; children: React.ReactNode; label: string }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44, minWidth: 44, justifyContent: "center", paddingHorizontal: 8, borderRadius: 10, backgroundColor: pressed ? th.surface2 : "transparent" })}>
      {children}
    </Pressable>
  );
}

export function TopBar() {
  const th = useTheme(); const s = useS(); const ins = useSafeAreaInsets();
  const [shop, setShop] = useState(false); const [streak, setStreak] = useState(false);
  const num = (n: number, c: string) => <Text style={{ fontFamily: F.bodyHeavy, fontSize: 16, color: c, fontVariant: ["tabular-nums"] }}>{n}</Text>;
  const wait = minsToHeart(s.hearts, s.heartAt);
  const days = [...Array(7)].map((_, i) => dayAdd(day(), i - 6));
  const buy = (cost: number, fn: () => void, msg: string) => { if (s.gems < cost) return toast(t("notEnough")); update((x) => { x.gems -= cost; fn(); }); sfx("chest"); setShop(false); toast(msg); };
  return (
    <View style={{ paddingTop: ins.top, backgroundColor: th.bg, borderBottomWidth: 1, borderColor: th.line }}>
      <View style={{ height: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 2, maxWidth: 640, width: "100%", alignSelf: "center" }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4 }} accessible accessibilityRole="header" accessibilityLabel="Kew">
          <Sun size={20} color={th.zer} />
          <Text style={{ fontFamily: F.italicBold, fontSize: 26, lineHeight: 30, color: th.ink, letterSpacing: -0.4 }}>Kew</Text>
        </View>
        <Stat onPress={() => setStreak(true)} label={t("streakAria", { n: s.streak })}><Icon.fire size={22} color={s.last === day() ? th.fire : th.faint} />{num(s.streak, s.last === day() ? th.fire : th.muted)}</Stat>
        <Stat onPress={() => setShop(true)} label={t("gemsAria", { n: s.gems })}><Icon.gem size={21} color={th.sky} />{num(s.gems, th.skyDeep)}</Stat>
        <Stat onPress={() => setShop(true)} label={t("heartsAria", { n: s.hearts })}><Icon.heart size={22} color={th.sor} />{num(s.hearts, th.sorDeep)}</Stat>
        <Stat onPress={() => router.push("/settings")} label={t("settings")}><Icon.gear size={22} color={th.muted} /></Stat>
      </View>

      <Sheet visible={shop} onClose={() => setShop(false)}>
        <Text style={{ fontFamily: F.italic, fontSize: TS.md, color: th.muted }}>{t("shop")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Icon.gem size={26} color={th.sky} /><Text style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("gemsN", { n: s.gems })}</Text></View>
        <Text style={{ fontFamily: F.body, color: th.muted }}>{t("heartsOf", { h: s.hearts, m: MAXH })}{wait ? ` · ${t("nextHeart", { n: wait })}` : ""}</Text>
        {[{ ic: <Icon.heart size={30} color={th.sor} />, ti: t("refillTitle"), su: t("refillSub"), cost: 350, dis: s.hearts >= MAXH, act: () => buy(350, () => update((x) => { x.hearts = MAXH; }), t("refilled")) },
          { ic: <Icon.ice size={30} color={th.sky} />, ti: t("freezeTitle"), su: t("freezeSub", { n: s.freeze }), cost: 200, dis: s.freeze >= 2, act: () => buy(200, () => update((x) => { x.freeze++; }), t("freezeBought")) }].map((it) => (
          <View key={it.ti} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: th.line }}>
            {it.ic}
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.serif, color: th.ink, fontSize: TS.lg }}>{it.ti}</Text><Text style={{ fontFamily: F.body, color: th.muted, fontSize: TS.xs }}>{it.su}</Text></View>
            <Btn title={String(it.cost)} kind="sky" disabled={it.dis} onPress={it.act} icon={<Icon.gem size={16} color="#fff" />} style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 12 }} />
          </View>
        ))}
        <Text style={{ fontFamily: F.body, color: th.muted, fontSize: 13 }}>{t("shopNote")}</Text>
        <Btn title={t("close")} kind="ghost" onPress={() => setShop(false)} />
      </Sheet>

      <Sheet visible={streak} onClose={() => setStreak(false)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Icon.fire size={56} color={th.fire} />
          <View><Text style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("streakTitle", { n: s.streak })}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{t("bestStreak", { n: s.best })}</Text></View>
        </View>
        <WeekDots days={days} xpLog={s.xpLog} />
        <Text style={{ fontFamily: F.body, color: th.muted }}>{s.last === day() ? t("streakDoneToday") : t("streakTodo")}</Text>
        <Btn title={t("ok")} onPress={() => setStreak(false)} />
      </Sheet>
    </View>
  );
}

export function WeekDots({ days, xpLog }: { days: string[]; xpLog: Record<string, number> }) {
  const th = useTheme(); const names = tArr("days");
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {days.map((d) => { const on = (xpLog[d] || 0) > 0; return (
        <View key={d} style={{ alignItems: "center", gap: 4 }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, color: th.muted }}>{names[new Date(d + "T12:00").getDay()]}</Text>
          <View style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", width: 24, height: 24, borderRadius: 5, transform: [{ rotate: "45deg" }], backgroundColor: on ? th.fire : "transparent", borderWidth: on ? 0 : 1.5, borderColor: th.line2 }} />
            <View>{on ? <Icon.check size={16} /> : <Diamond size={6} color={th.line2} />}</View>
          </View>
        </View>); })}
    </View>
  );
}
