import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { M, t } from "@/lib/i18n";
import { addFriend, DEMOTE, joinLeague, leaveLeague, myRank, PROMOTE, removeFriend, syncLeague, TIERS, weekXP } from "@/lib/league";
import { useStore } from "@/lib/store";
import { Diamond, KilimRule, Medallion } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { Btn, H2, toast } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

const left = (ends: number) => {
  const ms = Math.max(0, ends - Date.now()), d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return d > 0 ? t("lgEnds", { d, h }) : t("lgEndsH", { h: Math.max(1, h) });
};
const COURSE_TAG: Record<string, string> = { kmr: "Kurmancî", ckb: "Soranî", zza: "Kirmanckî", eng: "English", deu: "Deutsch" };

/** «Haftalık lig»: weekly XP race in groups of 30, ten tiers from Tov (seed) to Stêrk (star), plus friends by code. */
export default function League() {
  const th = useTheme();
  const lg = useStore((s) => s.lg);
  const st = useStore((s) => s.lgCache);
  const [loading, setLoading] = useState(!!lg), [err, setErr] = useState<string | null>(null);
  const [nick, setNick] = useState(""), [code, setCode] = useState(""), [sure, setSure] = useState(false);

  const joined = !!lg;
  useEffect(() => { if (joined) syncLeague(true).then((e) => { setErr(e); setLoading(false); }); }, [joined]);

  const join = async () => {
    const n = nick.trim(); if (n.length < 2 || n.length > 16) { toast(t("lgNickBad")); return; }
    setLoading(true); const e = await joinLeague(n); setLoading(false);
    if (e) { toast(e === "nick" ? t("lgNickBad") : t("lgErr")); buzz("bad"); } else { sfx("win"); buzz("win"); }
  };
  const add = async () => {
    const c = code.trim(); if (!c) return;
    const e = await addFriend(c);
    if (!e) { setCode(""); toast(t("lgAdded")); buzz("ok"); } else toast(e === "no such code" ? t("lgNoCode") : e === "self" ? t("lgSelf") : t("lgErr"));
  };
  const share = () => { if (st) Share.share({ message: t("lgShareMsg", { c: st.code }) }).catch(() => {}); };
  const leave = async () => {
    if (!sure) { setSure(true); return; }
    const ok = await leaveLeague(); setSure(false);
    if (!ok) toast(t("lgErr"));
  };

  const head = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 60 }}>
      <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("lgTitle")}</Text>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
    </View>);

  if (!lg) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      {head}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Medallion size={150} color={TIERS[0].c} accent={th.zer} seed={11} />
        </Animated.View>
        <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 34, color: th.ink, textAlign: "center" }}>{t("lgJoinTitle")}</Text>
        <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 24, color: th.muted, textAlign: "center" }}>{t("lgJoinText")}</Text>
        <TierStrip tier={-1} />
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{t("lgNick")}</Text>
          <TextInput value={nick} onChangeText={setNick} maxLength={16} autoCapitalize="words" autoCorrect={false} placeholder={t("lgNickPh")} placeholderTextColor={th.muted} onSubmitEditing={join}
            accessibilityLabel={t("lgNick")}
            style={{ fontFamily: F.bodySemi, fontSize: 18, color: th.ink, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: th.line2, backgroundColor: th.surface }} />
        </View>
        <Btn title={loading ? "…" : t("lgJoin")} onPress={join} disabled={loading} />
        <Text style={{ fontFamily: F.italic, fontSize: TS.sm, lineHeight: 20, color: th.muted }}>{t("lgPrivacy")}</Text>
      </ScrollView>
    </SafeAreaView>);

  const tier = st?.tier ?? 0, T = TIERS[tier], n = st?.group.length ?? 0, rank = st ? myRank(st) : 0;
  const up = PROMOTE(n), down = DEMOTE(n, tier);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      {head}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 16, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ borderRadius: 18, borderTopLeftRadius: 4, backgroundColor: th.panel, overflow: "hidden" }}>
          <KilimRule color={th.zer} accent={T.c} h={12} seed={tier * 5 + 3} style={{ marginTop: 12, marginHorizontal: 12, width: undefined }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
            <Animated.View key={tier} entering={ZoomIn.springify().damping(12)}><Medallion size={84} color={T.c} accent={th.zer} seed={tier + 2} /></Animated.View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 33, color: th.panelInk }}>{t("lgTier", { t: T.ku })}</Text>
              <Text style={{ fontFamily: F.italicBold, fontSize: TS.md, color: th.zer }}>{M(T.m)}</Text>
              {st ? <Text style={{ fontFamily: F.bodySemi, fontSize: TS.sm, color: "rgba(246,240,228,0.8)" }}>{left(st.ends)} · {t("lgWeekXp", { n: weekXP() })}</Text> : null}
            </View>
          </View>
        </View>
        <TierStrip tier={tier} />

        {st && st.result !== 0 ? (
          <Animated.View entering={FadeInDown} style={{ padding: 14, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: st.result > 0 ? th.keskSoft : th.sorSoft }}>
            <Text style={{ fontFamily: F.bodyHeavy, color: st.result > 0 ? th.keskDeep : th.sorDeep }}>{t(st.result > 0 ? "lgPromoted" : "lgDemoted", { t: T.ku })}</Text>
          </Animated.View>) : null}
        {err === "net" ? <Text style={{ fontFamily: F.italic, color: th.muted }}>{t("lgOffline")}</Text> : null}
        {loading && !st ? <Text style={{ fontFamily: F.italic, color: th.muted }}>…</Text> : null}

        {st && n === 0 ? <Text style={{ fontFamily: F.body, fontSize: TS.md, lineHeight: 23, color: th.muted }}>{t("lgEmpty")}</Text> : null}
        {st && n > 0 ? (
          <View style={{ borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface, overflow: "hidden" }}>
            {st.group.map((r, i) => {
              const pos = i + 1, inUp = pos <= up, inDown = down > 0 && pos > n - down;
              const medal = pos === 1 ? th.zer : pos === 2 ? "#A7AFB8" : pos === 3 ? "#B9773E" : null;
              return (
                <View key={i}>
                  {pos === up + 1 && up < n ? <Zone label={t("lgUp")} color={th.kesk} /> : null}
                  {down > 0 && pos === n - down + 1 ? <Zone label={t("lgDown")} color={th.sor} /> : null}
                  <Animated.View entering={FadeInDown.delay(Math.min(i, 12) * 35).duration(220)} accessible accessibilityLabel={`${pos}. ${r.nick}, ${r.xp} XP`}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: r.me ? th.keskSoft : "transparent" }}>
                    <View style={{ width: 28, alignItems: "center" }}>
                      {medal ? <Diamond size={20} color={medal} /> : null}
                      <Text style={{ position: medal ? "absolute" : "relative", top: medal ? 1 : 0, fontFamily: F.bodyHeavy, fontSize: medal ? 11 : TS.sm, color: medal ? "#fff" : inUp ? th.keskDeep : inDown ? th.sorDeep : th.muted }}>{pos}</Text>
                    </View>
                    <View style={{ width: 36, height: 36, borderRadius: 10, borderTopLeftRadius: 3, backgroundColor: r.me ? th.kesk : th.line, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: F.display, fontSize: 18, color: r.me ? "#fff" : th.ink }}>{r.nick.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontFamily: r.me ? F.bodyHeavy : F.body, fontSize: TS.md, color: th.ink }}>{r.nick}</Text>
                      {r.streak > 1 ? <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}><Icon.fire size={12} color={th.zer} /><Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: th.muted }}>{r.streak}</Text></View> : null}
                    </View>
                    <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.md, color: th.ink, fontVariant: ["tabular-nums"] }}>{r.xp} XP</Text>
                  </Animated.View>
                </View>);
            })}
          </View>) : null}
        {st && rank > 0 ? <Text style={{ fontFamily: F.italic, fontSize: TS.sm, color: th.muted, textAlign: "center" }}>{t("lgRule", { n: up })}</Text> : null}

        <KilimRule color={th.zer} accent={th.sor} h={10} seed={9} />
        <H2>{t("lgFriends")}</H2>
        {st ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: th.zerSoft }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.zerDeep }}>{t("lgMyCode")}</Text>
              <Text selectable style={{ fontFamily: F.display, fontSize: 28, letterSpacing: 4, color: th.ink }}>{st.code}</Text>
            </View>
            {Platform.OS !== "web" ? <Btn title={t("lgShare")} kind="gold" onPress={share} /> : null}
          </View>) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput value={code} onChangeText={(v) => setCode(v.toUpperCase())} maxLength={8} autoCapitalize="characters" autoCorrect={false} placeholder={t("lgAddPh")} placeholderTextColor={th.muted} onSubmitEditing={add}
            accessibilityLabel={t("lgAddPh")}
            style={{ flex: 1, fontFamily: F.bodyHeavy, fontSize: 18, letterSpacing: 2, color: th.ink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: th.line2, backgroundColor: th.surface }} />
          <Btn title={t("lgAdd")} kind="sky" onPress={add} disabled={!code.trim()} />
        </View>
        {st && st.friends.length === 0 ? <Text style={{ fontFamily: F.body, color: th.muted, lineHeight: 22 }}>{t("lgNoFriends")}</Text> : null}
        {st?.friends.map((f, i) => (
          <Animated.View key={f.code} entering={FadeInDown.delay(i * 40)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, borderTopLeftRadius: 3, backgroundColor: th.skySoft, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: F.display, fontSize: 20, color: th.skyDeep }}>{f.nick.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: F.bodyHeavy, fontSize: TS.md, color: th.ink }}>{f.nick}</Text>
              <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.muted }}>{COURSE_TAG[f.course] ?? f.course} · {t("lgWeekXp", { n: f.xp })}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Icon.fire size={16} color={f.streak ? th.zer : th.line2} /><Text style={{ fontFamily: F.bodyHeavy, color: th.ink }}>{f.streak}</Text></View>
            <Pressable onPress={() => removeFriend(f.code)} accessibilityRole="button" accessibilityLabel={`${t("lgRemove")}: ${f.nick}`} hitSlop={8} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
              <Icon.x size={16} color={th.muted} />
            </Pressable>
          </Animated.View>))}

        <Pressable onPress={leave} accessibilityRole="button" style={{ alignSelf: "center", paddingVertical: 14 }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.sm, color: sure ? th.sor : th.muted }}>{sure ? t("lgLeaveSure") : t("lgLeave")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>);
}

function Zone({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 4 }}>
      <View style={{ flex: 1, borderTopWidth: 2, borderStyle: "dashed", borderColor: color }} />
      <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 0.6, color }}>{label.toUpperCase()}</Text>
      <View style={{ flex: 1, borderTopWidth: 2, borderStyle: "dashed", borderColor: color }} />
    </View>);
}

/** The ten tiers as a row of kilim diamonds; the current one is large and labelled. */
function TierStrip({ tier }: { tier: number }) {
  const th = useTheme();
  return (
    <View accessible accessibilityLabel={TIERS.map((x) => x.ku).join(", ")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 }}>
      {TIERS.map((x, i) => (
        <View key={x.ku} style={{ alignItems: "center", gap: 3, opacity: tier < 0 || i <= tier ? 1 : 0.35 }}>
          <Diamond size={i === tier ? 26 : 16} color={x.c} filled={tier < 0 || i <= tier} />
          {i === tier ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 10, color: th.ink }}>{x.ku}</Text> : null}
        </View>))}
    </View>);
}
