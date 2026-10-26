import { useState } from "react";
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from "react-native-svg";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { CHARS } from "@/lib/course";
import { jujiNodes, type JNode } from "./jujiArt";
import { useTheme } from "./theme";

export function Sun({ size = 34, color }: { size?: number; color?: string }) {
  const th = useTheme(); const rays = 21, r1 = 28, r2 = 47; const pts: string[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 - Math.PI / 2, b = a + (Math.PI / rays) * 0.62, c = a - (Math.PI / rays) * 0.62;
    const p = (ang: number, r: number) => `${(50 + Math.cos(ang) * r).toFixed(1)},${(50 + Math.sin(ang) * r).toFixed(1)}`;
    pts.push(`${p(a, r2)} ${p(b, r1)} ${p(c, r1)}`);
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G fill={color ?? th.zer}>{pts.map((p, i) => <Polygon key={i} points={p} />)}<Circle cx={50} cy={50} r={29} /></G>
    </Svg>
  );
}

const JUJI = { happy: jujiNodes(false), sad: jujiNodes(true) };
function jNode(n: JNode, k: number): React.ReactElement {
  const { p } = n;
  if (n.t === "circle") return <Circle key={k} {...p} />;
  if (n.t === "ellipse") return <Ellipse key={k} {...p} />;
  if (n.t === "g") return <G key={k} {...p}>{n.c?.map(jNode)}</G>;
  return <Path key={k} d={String(p.d)} {...p} />;
}

/** Juji, the app's hedgehog mascot ("jûjî" in Kurmancî). Artwork lives in jujiArt.ts. */
export function Juji({ size = 120, sad = false }: { size?: number; sad?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Juji" importantForAccessibility="no-hide-descendants">
      {(sad ? JUJI.sad : JUJI.happy).map(jNode)}
    </Svg>
  );
}

export function Chest({ size = 80, open = false, lock = false }: { size?: number; open?: boolean; lock?: boolean }) {
  const th = useTheme();
  const body = lock ? th.locked : "#c9822b", deep = lock ? th.lockedDeep : "#9e5f19", lid = lock ? th.locked : "#e0a03f";
  const y = open ? 30 : 26;
  return (
    <Svg width={size} height={size * 0.875} viewBox="0 0 80 70">
      <Rect x={8} y={y} width={64} height={38} rx={8} fill={body} />
      <Path d={`M8 ${y} h64 v10 H8z`} fill={deep} />
      {open ? <G><Path d="M10 28 L18 4 h44 l8 24z" fill={lid} /><Circle cx={40} cy={20} r={9} fill={th.zer} /></G> : <Path d="M8 26 Q8 6 24 6 h32 Q72 6 72 26z" fill={lid} />}
      <Rect x={34} y={open ? 36 : 30} width={12} height={16} rx={3} fill={lock ? th.lockedDeep : th.zer} />
      <Rect x={20} y={y} width={6} height={38} fill={deep} opacity={0.6} />
      <Rect x={54} y={y} width={6} height={38} fill={deep} opacity={0.6} />
    </Svg>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  if (name === "Juji") return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#F3E3C4", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><Juji size={size * 1.12} /></View>;
  if (name === "Rovî") return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#ffe6cf", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: size * 0.6 }}>🦊</Text></View>;
  const c = CHARS[name] || { c: "#1f8a4c", hair: "#333", g: "m" };
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={24} fill={c.c} />
      <Path d="M8 48 Q8 34 24 34 Q40 34 40 48Z" fill="#00000055" />
      {c.scarf ? <Path d="M11 30 Q12 9 24 9 Q36 9 37 30 Q35 36 24 36 Q13 36 11 30Z" fill={c.scarf} /> : null}
      {c.g === "f" && !c.scarf ? <Path d="M12 31 Q11 10 24 10 Q37 10 36 31 Q33 26 33 20 L15 20 Q15 26 12 31Z" fill={c.hair} /> : null}
      <Circle cx={24} cy={23} r={10} fill="#e8b98f" />
      {c.g === "m" ? <Path d="M14 21 Q14 11 24 11 Q34 11 34 21 Q30 15 24 16 Q18 15 14 21Z" fill={c.hair} />
        : c.scarf ? <Path d="M14 21 Q15 12 24 12 Q33 12 34 21 Q30 16 24 16 Q18 16 14 21Z" fill={c.scarf} />
        : <Path d="M14 20 Q16 12 24 12 Q32 12 34 20 Q28 15 24 17 Q20 15 14 20Z" fill={c.hair} />}
      <Circle cx={20.5} cy={23} r={1.3} fill="#2a1a12" /><Circle cx={27.5} cy={23} r={1.3} fill="#2a1a12" />
      {c.moust ? <Path d="M20 28.5 Q24 26.5 28 28.5 Q24 30 20 28.5Z" fill={c.hair} /> : <Path d="M21 28 Q24 30 27 28" stroke="#9a5a3a" strokeWidth={1.4} fill="none" strokeLinecap="round" />}
    </Svg>
  );
}

/** Course badge: the Kurdish tricolour with the 21-ray sun. */
export function Flag({ w = 34 }: { w?: number }) {
  const rays = 21, r1 = 3.4, r2 = 6.2, pts: string[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 - Math.PI / 2, b = a + (Math.PI / rays) * 0.6, c = a - (Math.PI / rays) * 0.6;
    const p = (ang: number, r: number) => `${(15 + Math.cos(ang) * r).toFixed(2)},${(10 + Math.sin(ang) * r).toFixed(2)}`;
    pts.push(`${p(a, r2)} ${p(b, r1)} ${p(c, r1)}`);
  }
  return (
    <Svg width={w} height={(w * 2) / 3} viewBox="0 0 30 20">
      <Rect x={0} y={0} width={30} height={20} rx={3} fill="#fff" />
      <Path d="M3 0h24a3 3 0 0 1 3 3v3.67H0V3a3 3 0 0 1 3-3Z" fill="#ed2024" />
      <Path d="M0 13.33h30V17a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3Z" fill="#278e43" />
      <G fill="#febd11">{pts.map((p, i) => <Polygon key={i} points={p} />)}<Circle cx={15} cy={10} r={3.6} /></G>
      <Rect x={0.5} y={0.5} width={29} height={19} rx={2.6} fill="none" stroke="rgba(0,0,0,0.12)" />
    </Svg>
  );
}

/* ---------- kilim motifs ---------- */
/** Tiny seeded PRNG so the "hand-drawn" wobble is stable between renders. */
function prng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/**
 * A woven border strip: a row of "eye" lozenges (göz) between two warp lines, each stitch
 * nudged a little so it reads as hand-woven, not vector-perfect. Measures its own width.
 */
export function KilimRule({ color, h = 12, seed = 7, style, accent, lines = true }: { color: string; h?: number; seed?: number; style?: StyleProp<ViewStyle>; accent?: string; lines?: boolean }) {
  const [w, setW] = useState(0);
  const step = h * 1.9; const n = Math.max(1, Math.floor(w / step)); const off = (w - n * step) / 2;
  const r = prng(seed); const j = () => (r() - 0.5) * h * 0.09;
  const shapes: string[] = []; const dots: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const cx = off + step * i + step / 2, cy = h / 2, rx = h * 0.42, ry = h * 0.42;
    shapes.push(`M${cx + j()} ${cy - ry + j()} L${cx + rx + j()} ${cy + j()} L${cx + j()} ${cy + ry + j()} L${cx - rx + j()} ${cy + j()}Z`);
    dots.push([cx + j(), cy + j()]);
  }
  return (
    <View style={[{ height: h, alignSelf: "stretch" }, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)} pointerEvents="none">
      {w > 0 && (
        <Svg width={w} height={h}>
          {lines ? <Path d={`M0 0.75 H${w} M0 ${h - 0.75} H${w}`} stroke={color} strokeWidth={1.5} opacity={0.55} /> : null}
          {shapes.map((d, i) => <Path key={i} d={d} fill={i % 2 ? color : "none"} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />)}
          {dots.map(([x, y], i) => (i % 2 ? null : <Circle key={i} cx={x} cy={y} r={h * 0.1} fill={accent ?? color} />))}
        </Svg>
      )}
    </View>
  );
}

/** A single lozenge, filled or outlined. Used as bullet, rating pip and tab marker. */
export function Diamond({ size = 10, color, filled = true, stroke = 1.6 }: { size?: number; color: string; filled?: boolean; stroke?: number }) {
  const s = size, m = stroke;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Path d={`M${s / 2} ${m} L${s - m} ${s / 2} L${s / 2} ${s - m} L${m} ${s / 2}Z`} fill={filled ? color : "none"} stroke={color} strokeWidth={m} strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Larger kilim medallion: nested lozenges with hooked arms (after the "ram's horn" / elibelinde
 * family of motifs). Used once per moment: level openings and the lesson-complete screen.
 */
export function Medallion({ size = 120, color, accent, seed = 3, core = true }: { size?: number; color: string; accent: string; seed?: number; core?: boolean }) {
  const r = prng(seed); const j = () => (r() - 0.5) * 1.6;
  const d = (k: number) => `M${50 + j()} ${50 - k + j()} L${50 + k + j()} ${50 + j()} L${50 + j()} ${50 + k + j()} L${50 - k + j()} ${50 + j()}Z`;
  const hooks = [0, 1, 2, 3].map((q) => {
    const a = (q * Math.PI) / 2; const c = Math.cos(a), s = Math.sin(a);
    const P = (x: number, y: number) => `${(50 + x * c - y * s + j()).toFixed(1)} ${(50 + x * s + y * c + j()).toFixed(1)}`;
    return `M${P(38, 0)} L${P(46, 0)} M${P(46, 0)} L${P(46, -7)} L${P(41, -7)} M${P(46, 0)} L${P(46, 7)} L${P(41, 7)}`;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={d(36)} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d={d(26)} fill={color} opacity={0.18} />
      <Path d={d(26)} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      {core ? <Path d={d(14)} fill={accent} /> : null}
      {core ? <Circle cx={50} cy={50} r={3.4} fill={color} /> : null}
      {hooks.map((h, i) => <Path key={i} d={h} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
    </Svg>
  );
}
