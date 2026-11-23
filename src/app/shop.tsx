import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { M, t } from "@/lib/i18n";
import { MAXH, update, useS } from "@/lib/store";
import { Juji, KilimRule, SCARVES } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, confetti, toast } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

/** One-time promo codes (case-insensitive) → gems. Share them on social media, Newroz, etc. */
const PROMO: Record<string, number> = { NEWROZ: 300, JUJI: 150, SILAV: 100, KILIM: 200 };
const BOOST_MIN = 15, INF_MIN = 60;

const left = (until: number | undefined) => Math.max(0, Math.ceil(((until ?? 0) - Date.now()) / 60000));

/** «Mağaza»: everything costs gems earned by learning — no real money. */
export default function Shop() {
  const th = useTheme(); const s = useS();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30_000); return () => clearInterval(id); }, []);
  const [code, setCode] = useState("");

  const buy = (cost: number, fn: (x: typeof s) => void, msg: string) => {
    if (s.gems < cost) { buzz("bad"); toast(t("notEnough")); return; }
    update((x) => { x.gems -= cost; fn(x); }); sfx("chest"); buzz("win"); toast(msg);
  };
  const redeem = () => {
    const c = code.trim().toUpperCase(); if (!c) return;
    const g = PROMO[c];
    if (!g) { buzz("bad"); toast(t("promoBad")); return; }
    if (s.promo?.includes(c)) { toast(t("promoUsed")); return; }
    update((x) => { x.gems += g; x.promo = [...(x.promo ?? []), c]; }); setCode(""); sfx("chest"); buzz("win"); confetti(); toast(t("promoOk", { n: g }));
  };
  const boost = left(s.boostUntil), inf = left(s.infUntil);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 58, gap: 8 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
        <Text accessibilityRole="header" style={{ flex: 1, fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("shop")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 8 }} accessible accessibilityLabel={t("gemsAria", { n: s.gems })}>
          <Icon.gem size={22} color={th.sky} /><Animated.Text key={s.gems} entering={ZoomIn.springify().damping(10)} style={{ fontFamily: F.bodyHeavy, fontSize: 18, color: th.skyDeep }}>{s.gems}</Animated.Text>
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 14, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        {/* hero: how gems are earned */}
        <View style={{ borderRadius: 18, borderTopLeftRadius: 4, backgroundColor: th.panel, overflow: "hidden" }}>
          <KilimRule color={th.zer} accent={th.sor} h={12} seed={17} style={{ marginTop: 12, marginHorizontal: 12, width: undefined }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 16, paddingTop: 10 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontFamily: F.display, fontSize: 24, lineHeight: 29, color: th.panelInk }}>{t("shopHero")}</Text>
              <Text style={{ fontFamily: F.body, fontSize: TS.sm, lineHeight: 20, color: "rgba(246,240,228,0.85)" }}>{t("shopHeroSub")}</Text>
            </View>
            <Juji size={96} />
          </View>
        </View>

        <H>{t("shopBoosts")}</H>
        <Item i={0} badge={t("shopNew")} ic={<Icon.bolt size={30} color={th.zer} />} ti={t("boostTitle")} su={t("boostSub", { n: BOOST_MIN })} cost={100} dis={boost > 0}
          on={boost ? t("activeFor", { n: boost }) : undefined}
          act={() => buy(100, (x) => { x.boostUntil = Date.now() + BOOST_MIN * 60000; }, t("boostOn"))} />
        <Item i={1} ic={<Icon.heart size={30} color={th.sky} />} ti={t("infTitle")} su={t("infSub", { n: INF_MIN })} cost={450} dis={inf > 0}
          on={inf ? t("activeFor", { n: inf }) : undefined}
          act={() => buy(450, (x) => { x.infUntil = Date.now() + INF_MIN * 60000; x.hearts = MAXH; }, t("infOn"))} />
        <Item i={2} ic={<Icon.heart size={30} color={th.sor} />} ti={t("refillTitle")} su={t("refillSub")} cost={350} dis={s.hearts >= MAXH}
          on={s.hearts >= MAXH ? t("shopFull") : undefined}
          act={() => buy(350, (x) => { x.hearts = MAXH; }, t("refilled"))} />

        <H>{t("shopStreak")}</H>
        <Item i={3} ic={<Icon.ice size={30} color={th.sky} />} ti={t("freezeTitle")} su={t("freezeLong")} cost={200} dis={s.freeze >= 2}
          on={t("freezeHave", { n: s.freeze })}
          act={() => buy(200, (x) => { x.freeze++; }, t("freezeBought"))} />

        <H>{t("shopScarf")}</H>
        <Text style={{ fontFamily: F.body, color: th.muted, marginTop: -8 }}>{t("shopScarfSub")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          {Object.entries(SCARVES).map(([k, v], i) => {
            const own = v.cost === 0 || s.owned?.includes(k), on = (s.outfit ?? "nar") === k;
            const pick = () => {
              if (own) { update((x) => { x.outfit = k; }); sfx("tap"); buzz("select"); return; }
              buy(v.cost, (x) => { x.owned = [...(x.owned ?? []), k]; x.outfit = k; }, t("scarfBought", { s: v.ku }));
            };
            return (
              <Animated.View key={k} entering={FadeInDown.delay(150 + i * 40)} style={{ width: "48%" }}>
                <Pressable onPress={pick} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${v.ku}, ${M(v.m)}${own ? "" : `, ${v.cost}`}`}
                  style={({ pressed }) => ({ alignItems: "center", gap: 4, padding: 12, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: on ? 2.5 : 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: on ? th.kesk : th.line2, backgroundColor: on ? th.keskSoft : th.surface })}>
                  <Juji size={92} scarf={k} />
                  <Text style={{ fontFamily: F.serif, fontSize: TS.lg, color: th.ink }}>{v.ku}</Text>
                  <Text style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{M(v.m)}</Text>
                  {on ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, color: th.keskDeep }}>{t("scarfOn")}</Text>
                    : own ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, color: th.skyDeep }}>{t("scarfWear")}</Text>
                    : <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Icon.gem size={14} color={th.sky} /><Text style={{ fontFamily: F.bodyHeavy, fontSize: 14, color: th.skyDeep }}>{v.cost}</Text></View>}
                </Pressable>
              </Animated.View>);
          })}
        </View>

        <H>{t("promoTitle")}</H>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput value={code} onChangeText={(v) => setCode(v.toUpperCase())} maxLength={16} autoCapitalize="characters" autoCorrect={false} placeholder={t("promoPh")} placeholderTextColor={th.muted} onSubmitEditing={redeem}
            accessibilityLabel={t("promoTitle")}
            style={{ flex: 1, fontFamily: F.bodyHeavy, fontSize: 18, letterSpacing: 2, color: th.ink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: th.line2, backgroundColor: th.surface }} />
          <Btn title={t("promoUse")} kind="gold" onPress={redeem} disabled={!code.trim()} />
        </View>
        <Text style={{ fontFamily: F.italic, fontSize: TS.sm, color: th.muted, textAlign: "center", marginVertical: 12 }}>{t("shopFree")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Item({ ic, ti, su, cost, dis, on, act, badge, i }: { ic: React.ReactNode; ti: string; su: string; cost: number; dis?: boolean; on?: string; act: () => void; badge?: string; i: number }) {
  const th = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(i * 50).duration(260)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1.5, borderBottomWidth: 4, borderColor: th.line2, backgroundColor: th.surface }}>
      {badge ? <Text style={{ position: "absolute", top: -9, right: 12, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6, backgroundColor: th.sor, color: "#fff", fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 0.6 }}>{badge}</Text> : null}
      <View style={{ width: 54, height: 54, borderRadius: 14, borderTopLeftRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: th.surface2 }}>{ic}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{ti}</Text>
        <Text style={{ fontFamily: F.body, fontSize: TS.sm, lineHeight: 19, color: th.muted }}>{su}</Text>
        {on ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 0.5, color: th.keskDeep }}>{on}</Text> : null}
      </View>
      <Btn title={String(cost)} kind="sky" disabled={dis} onPress={act} icon={<Icon.gem size={15} color="#fff" />} style={{ minHeight: 42, paddingVertical: 6, paddingHorizontal: 12 }} />
    </Animated.View>);
}
function H({ children }: { children: string }) {
  const th = useTheme();
  return <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink, marginTop: 8 }}>{children}</Text>;
}
