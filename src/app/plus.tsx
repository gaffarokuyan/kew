import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@/lib/i18n";
import { hasPlus, PLUS_FEATURES, TRIAL_DAYS } from "@/lib/plus";
import { useS } from "@/lib/store";
import { Juji, KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, toast } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

/** Shown prices are placeholders until Google Play returns the real localised ones. */
const PRICE = { monthly: "69,99 ₺", yearly: "449,99 ₺", yearlyMonth: "37,50 ₺" };

/** «Juji Plus»: free vs Plus table, monthly / yearly plans, 7-day free trial. Lessons stay free. */
export default function Plus() {
  const th = useTheme(); const s = useS();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const active = hasPlus();
  const start = () => { buzz("select"); toast(t("plusSoon")); }; // billing is wired in once Plus is switched on (lib/plus.ts)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.panel }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 12, height: 52, alignItems: "center" }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.panelInk} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 16, maxWidth: 520, width: "100%", alignSelf: "center" }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Animated.View entering={ZoomIn.springify().damping(11)}><Juji size={120} scarf="zer" /></Animated.View>
          <Text accessibilityRole="header" style={{ fontFamily: F.italicBold, fontSize: 42, lineHeight: 48, color: th.panelInk }}>Juji <Text style={{ color: th.zer }}>Plus</Text></Text>
          <KilimRule color={th.zer} accent={th.sor} h={10} seed={8} style={{ width: 180 }} />
          <Text style={{ fontFamily: F.display, fontSize: 24, lineHeight: 30, color: th.panelInk, textAlign: "center" }}>{t("plusHero")}</Text>
          <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 22, color: "rgba(246,240,228,0.8)", textAlign: "center" }}>{t("plusHeroSub")}</Text>
        </View>

        {/* free vs plus */}
        <View style={{ borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: th.surface, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: th.line }}>
            <Text style={{ flex: 1 }} />
            <Text style={{ width: 62, textAlign: "center", fontFamily: F.bodyHeavy, fontSize: 12, color: th.muted }}>{t("plusFree")}</Text>
            <Text style={{ width: 62, textAlign: "center", fontFamily: F.bodyHeavy, fontSize: 12, color: th.zerDeep }}>{t("plusPlus")}</Text>
          </View>
          {PLUS_FEATURES.map((f, i) => (
            <Animated.View key={f.k} entering={FadeInDown.delay(i * 45)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderColor: th.line }}>
              <Text style={{ flex: 1, fontFamily: F.bodySemi, fontSize: 15, lineHeight: 20, color: th.ink }}>{t(f.k)}</Text>
              <View style={{ width: 62, alignItems: "center" }}>{f.free ? <Icon.check size={18} color={th.kesk} /> : <Text style={{ color: th.faint, fontSize: 18 }}>–</Text>}</View>
              <View style={{ width: 62, alignItems: "center" }}><Icon.check size={18} color={th.zerDeep} /></View>
            </Animated.View>))}
        </View>

        {active ? (
          <Text style={{ fontFamily: F.bodyHeavy, color: th.zer, textAlign: "center" }}>{t("plusActive", { d: new Date(s.plus!.until!).toLocaleDateString() })}</Text>
        ) : <>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(["monthly", "yearly"] as const).map((k) => { const on = plan === k; return (
              <Pressable key={k} onPress={() => { buzz("select"); setPlan(k); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
                style={{ flex: 1, gap: 2, padding: 14, paddingTop: 18, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: on ? 2.5 : 1.5, borderColor: on ? th.zer : "rgba(246,240,228,0.3)", backgroundColor: on ? "rgba(217,162,27,0.14)" : "transparent" }}>
                {k === "yearly" ? <Text style={{ position: "absolute", top: -9, left: 12, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6, backgroundColor: th.zer, color: "#2E1F00", fontFamily: F.bodyHeavy, fontSize: 10, letterSpacing: 0.6 }}>{t("plusBest")}</Text> : null}
                <Text style={{ fontFamily: F.bodyHeavy, fontSize: 15, color: th.panelInk }}>{t(k === "yearly" ? "plusYearly" : "plusMonthly")}</Text>
                <Text style={{ fontFamily: F.display, fontSize: 22, color: th.panelInk }}>{k === "yearly" ? PRICE.yearly : PRICE.monthly}</Text>
                {k === "yearly" ? <Text style={{ fontFamily: F.body, fontSize: 12, color: "rgba(246,240,228,0.7)" }}>≈ {PRICE.yearlyMonth} / {t("plusMonthly").toLocaleLowerCase()}</Text> : null}
              </Pressable>); })}
          </View>
          <Btn title={t("plusTrial", { n: TRIAL_DAYS })} kind="gold" onPress={start} />
          <Text style={{ fontFamily: F.body, fontSize: 12, lineHeight: 18, color: "rgba(246,240,228,0.65)", textAlign: "center" }}>{t("plusTrialNote")}</Text>
          <Pressable onPress={start} accessibilityRole="button" style={{ alignSelf: "center", padding: 8, marginBottom: 12 }}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 13, color: "rgba(246,240,228,0.8)", textDecorationLine: "underline" }}>{t("plusRestore")}</Text>
          </Pressable>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
