import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { scriptOf } from "@/lib/course";
import { M, t } from "@/lib/i18n";
import { episodesFor, loadPods, titleOf, usePodsVersion, type Episode } from "@/lib/podcast";
import { useStore } from "@/lib/store";
import { Avatar, KilimRule } from "@/ui/art";
import { buzz } from "@/ui/haptics";
import { Icon } from "@/ui/icons";
import { H2 } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

/** Podcast shelf for the active course, grouped by level. */
export default function Podcasts() {
  const th = useTheme();
  usePodsVersion();
  const course = useStore((s) => s.course); const pods = useStore((s) => s.pods);
  useEffect(() => { loadPods(); }, []);
  const eps = episodesFor(course); const sc = course === "ckb" ? scriptOf() : null;
  const groups = eps.reduce<Record<string, Episode[]>>((g, e) => { (g[e.lvl] ||= []).push(e); return g; }, {});

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
        {Object.entries(groups).map(([lvl, list]) => (
          <View key={lvl} style={{ gap: 10 }}>
            <H2>{lvl}</H2>
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
          </View>))}
        <KilimRule color={th.zer} accent={th.sor} h={10} seed={7} />
      </ScrollView>
    </SafeAreaView>
  );
}
