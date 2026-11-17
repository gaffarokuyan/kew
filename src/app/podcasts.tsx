import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { scriptOf } from "@/lib/course";
import { M, t } from "@/lib/i18n";
import { episodesFor, loadPods, titleOf, usePodsVersion, type Episode } from "@/lib/podcast";
import { update, useStore } from "@/lib/store";
import { Avatar, KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { H2 } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

/** Podcast shelf for the active course, grouped by level. */
export default function Podcasts() {
  const th = useTheme();
  usePodsVersion();
  const course = useStore((s) => s.course); const pods = useStore((s) => s.pods); const picked = useStore((s) => s.podLvl?.[s.course]);
  useEffect(() => { loadPods(); }, []);
  const eps = episodesFor(course); const sc = course === "ckb" ? scriptOf() : null;
  const groups = eps.reduce<Record<string, Episode[]>>((g, e) => { (g[e.lvl] ||= []).push(e); return g; }, {});
  const levels = Object.keys(groups);
  // default: the first level that still has an unheard episode
  const lvl = picked && groups[picked] ? picked : levels.find((l) => groups[l].some((e) => !pods[e.id])) ?? levels[0];
  const pick = (l: string) => { sfx("tap"); buzz("tap"); update((s) => { s.podLvl = { ...s.podLvl, [s.course]: l }; }); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 60 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("podTitle")}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("close")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><Icon.x size={24} color={th.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4, gap: 18, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: th.panel }}>
          <Avatar name="Juji" size={56} />
          <Text style={{ flex: 1, fontFamily: F.bodySemi, fontSize: TS.sm, lineHeight: 21, color: th.panelInk }}>{t("podLead")}</Text>
        </View>
        {!eps.length ? <Text style={{ fontFamily: F.italic, fontSize: TS.md, color: th.muted, textAlign: "center", paddingVertical: 30 }}>{t("podEmpty")}</Text> : null}
        {levels.length ? (
          <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 10 }}>
            {levels.map((l) => {
              const on = l === lvl, n = groups[l].length, d = groups[l].filter((e) => pods[e.id]).length;
              return (
                <Pressable key={l} onPress={() => pick(l)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${l}, ${d}/${n}`}
                  style={{ flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: on ? 2 : 4,
                    borderColor: on ? th.plum : th.line2, backgroundColor: on ? th.plum : th.surface }}>
                  <Text style={{ fontFamily: F.display, fontSize: TS.xl, color: on ? "#fff" : th.ink }}>{l}</Text>
                  <Text style={{ fontFamily: F.bodySemi, fontSize: TS.xs, color: on ? "#fff" : th.muted }}>{d}/{n}</Text>
                </Pressable>);
            })}
          </View>) : null}
        {lvl ? [[lvl, groups[lvl]] as const].map(([lv, list]) => (
          <View key={lv} style={{ gap: 10 }}>
            <H2>{lv}</H2>
            {list.map((e) => {
              const done = !!pods[e.id];
              return (
                <Pressable key={e.id} onPress={() => { sfx("tap"); buzz("tap"); router.push({ pathname: "/episode", params: { id: e.id } }); }} accessibilityRole="button"
                  accessibilityLabel={`${t("podEp", { n: e.n })}. ${titleOf(e, sc)}. ${M(e.name)}${done ? ". " + t("podDoneTag") : ""}`}
                  style={({ pressed }) => ({ flexDirection: "row", gap: 14, alignItems: "center", padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: th.line2, backgroundColor: th.surface })}>
                  <View style={{ width: 48, height: 48, borderRadius: 12, borderTopLeftRadius: 3, backgroundColor: done ? th.kesk : th.plum, alignItems: "center", justifyContent: "center" }}>
                    {done ? <Icon.check size={24} /> : <Icon.pod size={26} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: F.body, fontSize: TS.xs, color: th.muted }}>{t("podEp", { n: e.n })} · {M(e.sub)}</Text>
                    <Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{titleOf(e, sc)}</Text>
                    <Text style={{ fontFamily: F.body, fontSize: TS.sm, color: th.muted }}>{M(e.name)}</Text>
                  </View>
                  {!e.audio ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, color: th.muted, borderWidth: 1, borderColor: th.line2, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>{t("podSoon")}</Text> : null}
                </Pressable>);
            })}
          </View>)) : null}
        <KilimRule color={th.zer} accent={th.sor} h={10} seed={7} />
      </ScrollView>
    </SafeAreaView>
  );
}
