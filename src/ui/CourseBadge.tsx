import { Pressable, Text, View } from "react-native";
import type { CourseId } from "@/lib/course";
import { F, type Theme, useTheme } from "@/ui/theme";

/** Each course gets a colour and a two-letter code, shown on a kilim diamond. */
export const COURSE_CODE: Record<CourseId, string> = { kmr: "KU", ckb: "SO", zza: "KI", eng: "EN", deu: "DE" };
export const courseColor = (id: CourseId, th: Theme) => (id === "ckb" ? th.sor : id === "zza" ? th.plum : id === "eng" ? th.sky : id === "deu" ? th.zerDeep : th.kesk);

export function CourseBadge({ id, size = 30 }: { id: CourseId; size?: number }) {
  const th = useTheme(); const c = courseColor(id, th);
  return (
    <View style={{ width: size + 6, height: size + 6, alignItems: "center", justifyContent: "center" }} importantForAccessibility="no-hide-descendants">
      <View style={{ position: "absolute", width: size * 0.78, height: size * 0.78, borderRadius: size * 0.16, transform: [{ rotate: "45deg" }], backgroundColor: c, borderWidth: 2, borderColor: th.zer }} />
      <Text style={{ fontFamily: F.bodyHeavy, fontSize: size * 0.36, letterSpacing: 0.3, color: "#fff" }}>{COURSE_CODE[id]}</Text>
    </View>);
}

/** A course as a tappable row: badge, name, subtitle, beta tag and a check when selected. */
export function CourseRow({ id, name, sub, beta, on, onPress }: { id: CourseId; name: string; sub: string; beta?: string; on: boolean; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${name}, ${sub}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: on ? 2 : 1.5, borderBottomWidth: pressed ? 1.5 : 4, marginTop: pressed ? 2.5 : 0, borderColor: on ? th.sky : th.line2, backgroundColor: on ? th.skySoft : th.surface })}>
      <CourseBadge id={id} size={34} />
      <View style={{ flex: 1, gap: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text style={{ fontFamily: F.display, fontSize: 19, color: th.ink }}>{name}</Text>
          {beta ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, color: th.zerDeep, borderWidth: 1, borderColor: th.zer, borderRadius: 6, paddingHorizontal: 5 }}>{beta}</Text> : null}
        </View>
        <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 13, color: th.muted }}>{sub}</Text>
      </View>
      {on ? <Text style={{ fontFamily: F.bodyHeavy, fontSize: 18, color: th.skyDeep }}>✓</Text> : null}
    </Pressable>);
}
