import { useMemo, useState } from "react";
import { SectionList, Text, TextInput, View } from "react-native";
import { hasAudio } from "@/lib/audio";
import { UNITS } from "@/lib/course";
import { norm } from "@/lib/exercises";
import { M, t } from "@/lib/i18n";
import { learned, useS, wordStrength } from "@/lib/store";
import { Diamond, Kew, KilimRule } from "@/ui/art";
import { PageHead, Spk } from "@/ui/kit";
import { F, TS, ucol, useTheme } from "@/ui/theme";

export default function Words() {
  const th = useTheme(); const s = useS(); const [q, setQ] = useState("");
  const lw = new Set(learned(s));
  const sections = useMemo(() => {
    const seen = new Set<string>(); const v = norm(q);
    return UNITS.map((u) => ({ ku: u.ku, name: M(u.name), col: u.col, data: u.words.filter((w) => lw.has(w[0]) && !seen.has(w[0]) && (seen.add(w[0]), true) && (!v || norm(w[0] + " " + M(w[1])).includes(v))) })).filter((x) => x.data.length);
  }, [q, s]);
  if (!lw.size) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14, backgroundColor: th.bg }}>
      <Kew size={120} />
      <KilimRule color={th.line2} accent={th.zer} h={10} seed={3} style={{ width: 140, alignSelf: "center" }} />
      <Text style={{ fontFamily: F.italic, fontSize: TS.md, lineHeight: 24, color: th.muted, textAlign: "center", maxWidth: 320 }}>{t("wordsEmpty")}</Text>
    </View>
  );
  return (
    <SectionList style={{ backgroundColor: th.bg }} sections={sections} keyExtractor={(w) => w[0]} stickySectionHeadersEnabled={false}
      contentContainerStyle={{ padding: 18, paddingBottom: 32, maxWidth: 560, width: "100%", alignSelf: "center" }}
      ListHeaderComponent={<View style={{ gap: 14, marginBottom: 4 }}>
        <PageHead title={t("words")} lead={t("wordsLead", { n: lw.size })} />
        <TextInput value={q} onChangeText={setQ} placeholder={t("search")} placeholderTextColor={th.faint} accessibilityLabel={t("search")}
          style={{ minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: th.line2, backgroundColor: th.surface, color: th.ink, fontFamily: F.bodySemi, fontSize: 16 }} />
      </View>}
      renderSectionHeader={({ section }) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22, marginBottom: 2, paddingBottom: 8, borderBottomWidth: 1.5, borderColor: ucol(section.col, th) }}>
          <Diamond size={9} color={ucol(section.col, th)} />
          <Text accessibilityRole="header" style={{ fontFamily: F.italicBold, fontSize: TS.lg, color: th.ink }}>{section.ku}<Text style={{ fontFamily: F.body, fontSize: TS.sm, color: th.muted }}>{"  "}{section.name}</Text></Text>
        </View>)}
      renderItem={({ item: w, index }) => { const st = wordStrength(w[0], s); return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 8, borderTopWidth: index ? 1 : 0, borderColor: th.line }}>
          {hasAudio(w[0]) ? <Spk text={w[0]} size={38} /> : <View style={{ width: 38 }} />}
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.serif, fontSize: TS.lg, lineHeight: 24, color: th.ink }}>{w[0]}</Text><Text style={{ fontFamily: F.body, color: th.muted }}>{M(w[1])}</Text></View>
          <View style={{ flexDirection: "row", gap: 2 }} accessible accessibilityLabel={t("strength", { n: st })}>
            {[0, 1, 2, 3].map((i) => <Diamond key={i} size={11} filled={i < st} color={i < st ? (st < 3 ? th.zer : th.kesk) : th.line2} stroke={1.4} />)}
          </View>
        </View>); }} />
  );
}
