import { useEffect, useState, type ReactNode } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { speak, sfx } from "@/lib/audio";
import { t, up } from "@/lib/i18n";
import { Icon } from "./icons";
import { F, shade, useTheme } from "./theme";

/* ---------- 3D button ---------- */
type BtnKind = "primary" | "ghost" | "sky" | "bad" | "gold";
export function Btn({ title, onPress, kind = "primary", disabled, style, icon, color, upper = true }: {
  title: string; upper?: boolean; onPress?: () => void; kind?: BtnKind; disabled?: boolean; style?: StyleProp<ViewStyle>; icon?: ReactNode; color?: string;
}) {
  const th = useTheme();
  const bg = color ?? (kind === "sky" ? th.sky : kind === "bad" ? th.sor : kind === "gold" ? th.zer : kind === "ghost" ? th.surface : th.kesk);
  const lip = kind === "ghost" ? th.line2 : shade(bg, 0.72);
  const fg = kind === "ghost" ? th.ink : kind === "gold" ? "#3a2a00" : "#fff";
  return (
    <Pressable disabled={disabled} onPress={() => { sfx("tap"); onPress?.(); }} accessibilityRole="button" accessibilityState={{ disabled }}
      style={({ pressed }) => [{ borderRadius: 16, backgroundColor: disabled ? th.surface2 : bg, borderBottomWidth: pressed || disabled ? 1 : 5, borderColor: disabled ? th.line : lip,
        borderWidth: kind === "ghost" ? 2 : 0, marginTop: pressed ? 4 : 0, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, style]}>
      {icon}
      <Text style={{ color: disabled ? th.faint : fg, fontFamily: F.bodyHeavy, fontSize: 16, letterSpacing: 0.8 }}>{upper ? up(title) : title}</Text>
    </Pressable>
  );
}

/* ---------- speaker button ---------- */
export function Spk({ text, slow, size = 44 }: { text: string; slow?: boolean; size?: number }) {
  const th = useTheme();
  return (
    <Pressable onPress={() => speak(text, slow)} accessibilityRole="button" accessibilityLabel={slow ? t("slow") : t("listen")}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: 14, backgroundColor: th.sky, alignItems: "center", justifyContent: "center", borderBottomWidth: pressed ? 0 : 4, borderColor: shade(th.sky, 0.72), marginTop: pressed ? 4 : 0 })}>
      {slow ? <Icon.turtle size={size * 0.5} /> : <Icon.spk size={size * 0.5} />}
    </Pressable>
  );
}

/* ---------- picture for a word: emoji, number or colour swatch ---------- */
export function Pic({ p, size = 56 }: { p?: string | null; size?: number }) {
  if (!p) return null;
  if (p.startsWith("#")) return <View style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: p, borderWidth: 2, borderColor: "rgba(0,0,0,0.12)" }} />;
  if (/^\d+$/.test(p)) return <Text style={{ fontFamily: F.display, fontSize: size * 0.7, lineHeight: size, color: "#1c8fc7" }}>{p}</Text>;
  return <Text style={{ fontSize: size * 0.8, lineHeight: size * 1.05 }}>{p}</Text>;
}

/* ---------- meter ---------- */
export function Meter({ pct, color, h = 12 }: { pct: number; color?: string; h?: number }) {
  const th = useTheme();
  return (
    <View style={{ height: h, borderRadius: 99, backgroundColor: th.surface2, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", borderRadius: 99, backgroundColor: color ?? th.zer }} />
    </View>
  );
}

/* ---------- bottom sheet / centred dialog ---------- */
export function Sheet({ visible, onClose, children, center, tint }: { visible: boolean; onClose: () => void; children: ReactNode; center?: boolean; tint?: string }) {
  const th = useTheme(); const ins = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <View style={{ flex: 1, justifyContent: center ? "center" : "flex-end" }}>
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={StyleSheet.absoluteFill}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(8,16,10,0.5)" }} onPress={onClose} accessibilityLabel={t("close")} />
          </Animated.View>
          <Animated.View entering={center ? FadeIn.duration(180) : SlideInDown.duration(260).easing(Easing.out(Easing.cubic))} exiting={center ? FadeOut : SlideOutDown.duration(200)}
            style={{ marginHorizontal: center ? 18 : 0, backgroundColor: tint ?? th.surface, borderRadius: 26, borderBottomLeftRadius: center ? 26 : 0, borderBottomRightRadius: center ? 26 : 0,
              padding: 20, paddingBottom: (center ? 20 : 20 + ins.bottom), gap: 14, maxHeight: Dimensions.get("window").height * 0.88 }}>
            {children}
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

/* ---------- toast ---------- */
let pushToast: ((m: string) => void) | null = null;
export const toast = (m: string) => pushToast?.(m);
export function ToastHost() {
  const th = useTheme(); const ins = useSafeAreaInsets(); const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { let tm: ReturnType<typeof setTimeout>; pushToast = (m) => { setMsg(m); clearTimeout(tm); tm = setTimeout(() => setMsg(null), 2600); }; return () => { pushToast = null; }; }, []);
  if (!msg) return null;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} pointerEvents="none" accessibilityLiveRegion="polite"
      style={{ position: "absolute", top: ins.top + 12, left: 20, right: 20, alignItems: "center", zIndex: 99 }}>
      <View style={{ backgroundColor: th.ink, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16 }}>
        <Text style={{ color: th.bg, fontFamily: F.bodyHeavy, fontSize: 15, textAlign: "center" }}>{msg}</Text>
      </View>
    </Animated.View>
  );
}

/* ---------- confetti ---------- */
const COLS = ["#1f8a4c", "#f5b400", "#d2342c", "#ffffff", "#1c8fc7"];
function Piece({ i, w }: { i: number; w: number }) {
  const [r] = useState(() => ({ x0: w / 2 + (Math.random() - 0.5) * 80, dx: (Math.random() - 0.5) * w * 1.1, up: 120 + Math.random() * 220, rot: (Math.random() - 0.5) * 900,
    delay: Math.random() * 120, dur: 1700 + Math.random() * 600, s: 6 + Math.random() * 6 }));
  const { x0, dx, up, rot } = r;
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(r.delay, withTiming(1, { duration: r.dur, easing: Easing.out(Easing.quad) })); }, [p, r]);
  const st = useAnimatedStyle(() => {
    const k = p.value;
    return { opacity: 1 - Math.max(0, k - 0.75) * 4, transform: [{ translateX: x0 + dx * k }, { translateY: 260 - up * Math.sin(k * Math.PI * 0.9) + k * k * 520 }, { rotate: `${rot * k}deg` }] };
  });
  const s = r.s;
  return <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: s, height: s / 2, backgroundColor: COLS[i % COLS.length], borderRadius: 1 }, st]} />;
}
let fireConfetti: (() => void) | null = null;
export const confetti = () => fireConfetti?.();
export function ConfettiHost() {
  const [k, setK] = useState(0); const w = Dimensions.get("window").width;
  useEffect(() => { let tm: ReturnType<typeof setTimeout>; fireConfetti = () => { setK((x) => x + 1); clearTimeout(tm); tm = setTimeout(() => setK(0), 2600); }; return () => { fireConfetti = null; }; }, []);
  if (!k) return null;
  return <View key={k} pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({ length: 90 }, (_, i) => <Piece key={i} i={i} w={w} />)}</View>;
}

/* ---------- small text helpers ---------- */
export function Txt({ style, children, ...p }: { style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number; accessibilityRole?: "header" }) {
  const th = useTheme();
  return <Text {...p} style={[{ color: th.ink, fontFamily: F.body, fontSize: 16 }, style]}>{children}</Text>;
}

export function Title({ children, color, size = 30 }: { children: ReactNode; color?: string; size?: number }) {
  const th = useTheme();
  return <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: size, lineHeight: size * 1.2, color: color ?? th.ink, textAlign: "center" }}>{children}</Text>;
}
export function Lead({ children }: { children: ReactNode }) {
  const th = useTheme();
  return <Text style={{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: th.muted, textAlign: "center", maxWidth: 340 }}>{children}</Text>;
}
