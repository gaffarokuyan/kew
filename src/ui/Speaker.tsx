import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { CHARS, courseId, WORD, type Char } from "@/lib/course";
import { M, t } from "@/lib/i18n";
import { getS, update, useStore } from "@/lib/store";
import { F, useTheme } from "@/ui/theme";

/* ============ full-body characters (Duolingo-style speakers) ============ */

/** A standing person drawn from the course's CHARS colours: shirt, hair, optional scarf / moustache. */
export function Person({ name, size = 110 }: { name: string; size?: number }) {
  const c: Char = CHARS[name] || { c: "#1f8a4c", hair: "#333", g: "m" };
  const skin = "#e8b98f", trousers = c.g === "f" ? c.c : "#3d4656";
  const bob = useSharedValue(0);
  useEffect(() => { bob.value = withRepeat(withSequence(withTiming(-2.5, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1); }, [bob]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const w = size * 0.62;
  return (
    <Animated.View style={[{ width: w, height: size }, st]} accessibilityLabel={name}>
      <Svg width={w} height={size} viewBox="0 0 62 100">
        <Ellipse cx={31} cy={97} rx={18} ry={3} fill="#00000022" />
        {/* legs / skirt */}
        {c.g === "f"
          ? <Path d="M17 58 L45 58 L50 88 L12 88Z" fill={trousers} />
          : <><Rect x={20} y={58} width={9} height={30} rx={3} fill={trousers} /><Rect x={33} y={58} width={9} height={30} rx={3} fill={trousers} /></>}
        <Rect x={17} y={87} width={12} height={6} rx={3} fill="#2a2020" /><Rect x={33} y={87} width={12} height={6} rx={3} fill="#2a2020" />
        {/* body + arms */}
        <Path d="M16 38 Q16 30 31 30 Q46 30 46 38 L46 60 L16 60Z" fill={c.c} />
        <Path d="M16 36 Q9 44 10 56" stroke={c.c} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Path d="M46 36 Q53 42 52 54" stroke={c.c} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Circle cx={10} cy={57} r={3.6} fill={skin} /><Circle cx={52} cy={55} r={3.6} fill={skin} />
        {c.scarf ? <Path d="M14 22 Q14 2 31 2 Q48 2 48 22 Q47 34 31 35 Q15 34 14 22Z" fill={c.scarf} /> : null}
        {c.g === "f" && !c.scarf ? <Path d="M15 26 Q13 4 31 4 Q49 4 47 26 Q44 21 44 14 L18 14 Q18 21 15 26Z" fill={c.hair} /> : null}
        <Circle cx={31} cy={17} r={11.5} fill={skin} />
        {c.g === "m" ? <Path d="M19.5 15 Q19 4 31 4 Q43 4 42.5 15 Q38 8 31 9 Q24 8 19.5 15Z" fill={c.hair} />
          : c.scarf ? <Path d="M19.5 15 Q20 5 31 5 Q42 5 42.5 15 Q38 9 31 9.5 Q24 9 19.5 15Z" fill={c.scarf} />
          : <Path d="M19 14 Q21 5 31 5 Q41 5 43 14 Q36 8 31 10 Q26 8 19 14Z" fill={c.hair} />}
        <Circle cx={27} cy={17} r={1.5} fill="#2a1a12" /><Circle cx={35} cy={17} r={1.5} fill="#2a1a12" />
        <Circle cx={24.5} cy={21} r={1.8} fill="#e98a7a" opacity={0.45} /><Circle cx={37.5} cy={21} r={1.8} fill="#e98a7a" opacity={0.45} />
        {c.moust ? <Path d="M26.5 22.5 Q31 20.5 35.5 22.5 Q31 24.2 26.5 22.5Z" fill={c.hair} /> : <Path d="M28 22.5 Q31 25 34 22.5" stroke="#9a5a3a" strokeWidth={1.4} fill="none" strokeLinecap="round" />}
      </Svg>
    </Animated.View>
  );
}

/** Picks a speaker for a sentence: same sentence → same person, from the course's own cast first. */
export function speakerFor(text: string) {
  const names = Object.keys(CHARS).filter((n) => !["Juji", "Rovî"].includes(n));
  if (!names.length) return "Juji";
  let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return names[h % names.length];
}

/* ============ tap a word to see its meaning ============ */

const clean = (s: string) => s.toLowerCase().replace(/[.,!?;:«»"“”()¿¡…]/g, "").replace(/[’‘]/g, "'").trim();
let glossFor = ""; let GLOSS: Map<string, string> = new Map();
function glossMap() {
  const id = courseId() + ":" + Object.keys(WORD).length;
  if (glossFor !== id) { GLOSS = new Map(); for (const w of Object.values(WORD)) { const k = clean(w.ku); if (k && !GLOSS.has(k)) GLOSS.set(k, M(w.m)); } glossFor = id; }
  return GLOSS;
}
type Seg = { s: string; m: string | null };
/** Splits a sentence into tappable chunks, preferring the longest known phrase (up to 3 words). */
export function segment(text: string): Seg[] {
  const g = glossMap(), toks = text.split(/\s+/).filter(Boolean), out: Seg[] = [];
  for (let i = 0; i < toks.length;) {
    let hit = 0, m: string | null = null;
    for (let n = Math.min(3, toks.length - i); n >= 1; n--) { const k = clean(toks.slice(i, i + n).join(" ")); if (g.has(k)) { hit = n; m = g.get(k)!; break; } }
    if (!hit) { const k = clean(toks[i]); const base = k.replace(/(s|es|ed|ing|'s)$/, ""); m = g.get(base) ?? null; hit = 1; }
    out.push({ s: toks.slice(i, i + hit).join(" "), m }); i += hit;
  }
  return out;
}

/** Sentence whose known words have a dotted underline; tapping one shows its meaning underneath it. */
export function GlossText({ text, size = 22 }: { text: string; size?: number }) {
  const th = useTheme();
  const segs = useMemo(() => segment(text), [text]);
  const [open, setOpen] = useState<number | null>(null);
  const seenHint = useStore((s) => !!s.tips?.gloss);
  const first = segs.findIndex((x) => x.m);
  const tap = (i: number) => {
    setOpen((o) => (o === i ? null : i));
    if (!getS().tips?.gloss) update((s) => { s.tips = { ...(s.tips || {}), gloss: true }; });
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", columnGap: 6, rowGap: 2 }}>
      {segs.map((g, i) => (
        <View key={i} style={{ zIndex: open === i ? 20 : 1 }}>
          {g.m ? (
            <Pressable onPress={() => tap(i)} accessibilityRole="button" accessibilityHint={t("glossHint")} hitSlop={4}>
              <Text style={{ fontFamily: F.serif, fontSize: size, lineHeight: size * 1.35, color: open === i ? th.skyDeep : th.ink, textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: th.faint }}>{g.s}</Text>
            </Pressable>
          ) : <Text style={{ fontFamily: F.serif, fontSize: size, lineHeight: size * 1.35, color: th.ink }}>{g.s}</Text>}
          {open === i && g.m ? (
            <Animated.View entering={ZoomIn.duration(160)} style={{ position: "absolute", top: size * 1.4, left: -6, minWidth: 90, maxWidth: 220, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: th.surface, borderWidth: 1.5, borderColor: th.line2, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 }}>
              <Text style={{ fontFamily: F.bodyHeavy, fontSize: 15, color: th.ink }}>{g.m}</Text>
            </Animated.View>
          ) : null}
          {!seenHint && i === first && open === null ? (
            <Animated.View entering={FadeIn.delay(500)} pointerEvents="none" style={{ position: "absolute", top: size * 1.45, left: -8, width: 170, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: th.panel }}>
              <View style={{ position: "absolute", top: -5, left: 16, width: 10, height: 10, backgroundColor: th.panel, transform: [{ rotate: "45deg" }] }} />
              <Text style={{ fontFamily: F.bodyHeavy, fontSize: 13, lineHeight: 17, color: th.panelInk }}>{t("glossHint")}</Text>
            </Animated.View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
