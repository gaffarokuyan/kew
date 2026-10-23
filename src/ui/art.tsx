import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from "react-native-svg";
import { Text, View } from "react-native";
import { CHARS } from "@/lib/course";
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

export function Kew({ size = 120, sad = false }: { size?: number; sad?: boolean }) {
  const th = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx={60} cy={111} rx={30} ry={5} fill={th.shadow} />
      <Path d="M24 70 Q10 64 14 52 Q24 60 32 60Z" fill="#8c98a6" />
      <Ellipse cx={58} cy={76} rx={38} ry={30} fill="#aeb9c6" />
      <Ellipse cx={66} cy={86} rx={25} ry={18} fill="#efe2c9" />
      <G strokeLinecap="round" strokeWidth={4.5} fill="none">
        <Path d="M34 68 q4 8 2 16" stroke="#2a2a2a" /><Path d="M40 66 q4 8 2 17" stroke="#b5562a" />
        <Path d="M46 65 q4 9 2 18" stroke="#2a2a2a" /><Path d="M52 66 q4 9 2 17" stroke="#b5562a" />
      </G>
      <Circle cx={72} cy={40} r={22} fill="#aeb9c6" />
      <Ellipse cx={78} cy={46} rx={13} ry={12} fill="#f7eedc" />
      <Path d="M58 36 Q72 31 90 38" fill="none" stroke="#1d1d1d" strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M90 38 Q86 56 66 60" fill="none" stroke="#1d1d1d" strokeWidth={4.5} strokeLinecap="round" />
      {sad ? (
        <Path d="M74 39 q5 -3 10 0" stroke="#1d1d1d" strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : (
        <G><Circle cx={79} cy={38} r={6.5} fill="#d2342c" /><Circle cx={79.5} cy={38} r={4} fill="#1d1d1d" /><Circle cx={81} cy={36.6} r={1.4} fill="#fff" /></G>
      )}
      <Path d="M91 40 L103 45 L91 50 Q88 45 91 40Z" fill="#d2342c" />
      <Path d="M50 103 v8 M50 111 h-5 M50 111 h5 M66 103 v8 M66 111 h-5 M66 111 h5" stroke="#d2342c" strokeWidth={3.5} strokeLinecap="round" />
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
  if (name === "Kew") return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#e8eef3", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><Kew size={size * 1.1} /></View>;
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
