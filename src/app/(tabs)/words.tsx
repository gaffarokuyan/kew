import { useMemo, useState } from "react";
import { SectionList, Text, TextInput, View } from "react-native";
import { hasAudio } from "@/lib/audio";
import { UNITS } from "@/lib/course";
import { norm } from "@/lib/exercises";
import { M, t, up } from "@/lib/i18n";
import { learned, useS, wordStrength } from "@/lib/store";
import { Kew } from "@/ui/art";
import { Spk } from "@/ui/kit";
import { F, useTheme } from "@/ui/theme";

export default function Words() {
  const th = useTheme(); const s = useS(); const [q, setQ] = useState("");
  const lw = new Set(learned(s));
  const sections = useMemo(() => {
    const seen = new Set<string>(); const v = norm(q);
    return UNITS.map((u) => ({ title: `${u.ku} · ${M(u.name)}`, data: u.words.filter((w) => lw.has(w[0]) && !seen.has(w[0]) && (seen.add(w[0]), true) && (!v || norm(w[0] + " " + M(w[1])).includes(v))) })).filter((x) => x.data.length);
  }, [q, s]);
  if (!lw.size) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14, backgroundColor: th.bg }}>
      <Kew size={120} /><Text style={{ fontFamily: F.body, color: th.muted, textAlign: "center" }}>{t("wordsEmpty")}</Text>
    </View>
  );
  return (
    <SectionList style={{ backgroundColor: th.bg }} sections={sections} keyExtractor={(w) => w[0]} stickySectionHeadersEnabled={false}
      contentContainerStyle={{ padding: 16, gap: 8, maxWidth: 560, width: "100%", alignSelf: "center" }}
      ListHeaderComponent={<View style={{ gap: 10, marginBottom: 6 }}>
        <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: 30, color: th.ink }}>{t("words")}</Text>
        <Text style={{ fontFamily: F.body, color: th.muted }}>{t("wordsLead", { n: lw.size })}</Text>
        <TextInput value={q} onChangeText={setQ} placeholder={t("search")} placeholderTextColor={th.faint} accessibilityLabel={t("search")}
          style={{ padding: 14, borderRadius: 14, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface, color: th.ink, fontFamily: F.body, fontSize: 16 }} />
      </View>}
      renderSectionHeader={({ section }) => <Text style={{ marginTop: 14, marginBottom: 4, fontFamily: F.bodyHeavy, fontSize: 12, letterSpacing: 1.3, color: th.muted }}>{up(section.title)}</Text>}
      renderItem={({ item: w }) => { const st = wordStrength(w[0], s); return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: th.line, backgroundColor: th.surface, marginBottom: 8 }}>
          {hasAudio(w[0]) ? <Spk text={w[0]} size={38} /> : null}
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bodyHeavy, fontSize: 17, color: th.ink }}>{w[0]}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{M(w[1])}</Text></View>
          <View style={{ flexDirection: "row", gap: 3 }} accessibilityLabel={t("strength", { n: st })}>
            {[0, 1, 2, 3].map((i) => <View key={i} style={{ width: 6, height: 18, borderRadius: 3, backgroundColor: i < st ? (st < 3 ? th.zer : th.kesk) : th.surface2 }} />)}
          </View>
        </View>); }} />
  );
}
