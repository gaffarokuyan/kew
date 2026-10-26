/*
 * Juji the hedgehog ("jûjî" in Kurmancî), drawn as plain data so the same artwork feeds the
 * in-app <Juji/> component and the icon/splash rasteriser. viewBox is 0 0 120 120.
 * Spines are rounded triangles with a seeded wobble so they read as hand-cut, not vector-perfect.
 */
export type JNode = { t: "path" | "circle" | "ellipse" | "g"; p: Record<string, string | number>; c?: JNode[] };

export const JUJI_COL = {
  spineBack: "#4E3220", spine: "#6B4A2F", spineTip: "#8F6640", flick: "#A97C50",
  face: "#F4E6CC", faceShade: "#E8D3AE", ink: "#2A1A12", ear: "#E9A493",
  cheek: "#D86A6F", scarf: "#B83440", scarfDeep: "#8C2230", saffron: "#E3A72F", indigo: "#34488F",
  feet: "#7A5232", tear: "#86BBE0", shadow: "rgba(42,33,27,0.13)",
};

function prng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f = (n: number) => n.toFixed(1);

/** One ring of spines: n rounded triangles fanned over the back, from -span..+span degrees off vertical. */
function ring(seed: number, n: number, span: number, rb: number, rt: number, half: number, cx: number, cy: number, offset = 0) {
  const r = prng(seed); const j = (k: number) => (r() - 0.5) * k; const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((-span + (2 * span * (i + offset)) / (n - 1)) * Math.PI) / 180 + j(0.05);
    const P = (ang: number, rad: number) => `${f(cx + Math.sin(ang) * rad)} ${f(cy - Math.cos(ang) * rad)}`;
    const tip = rt + j(3);
    out.push(`M${P(a - half, rb)} L${P(a + j(0.04), tip)} L${P(a + half, rb)}Z`);
  }
  return out.join(" ");
}

export function jujiNodes(sad = false): JNode[] {
  const C = JUJI_COL; const cx = 60, cy = 66;
  const drop = sad ? 4 : 0; // sad: spines sit lower and flatter
  const back = ring(11, 11, 104, 31, sad ? 44 : 48, 0.27, cx, cy + drop * 0.5);
  const mid = ring(23, 10, 94, 28, sad ? 40.5 : 44, 0.29, cx, cy + drop * 0.5, 0.5);
  const front = ring(37, 7, 74, 24, sad ? 36 : 39, 0.32, cx, cy + drop * 0.5);
  const sp = (d: string, col: string, w: number): JNode => ({ t: "path", p: { d, fill: col, stroke: col, strokeWidth: w, strokeLinejoin: "round" } });
  const eyeL = 47.5, eyeR = 72.5, eyeY = 70;
  const eyes: JNode[] = [];
  for (const ex of [eyeL, eyeR]) {
    const s = ex < 60 ? -1 : 1;
    eyes.push({ t: "ellipse", p: { cx: ex, cy: eyeY, rx: 5.8, ry: 6.8, fill: C.ink } });
    if (sad) {
      // droopy upper lid: the outer corner sags, the inner brow lifts
      const o = ex + 7.2 * s, i = ex - 7.2 * s;
      eyes.push({ t: "path", p: { d: `M${f(o)} ${f(eyeY - 9)} L${f(i)} ${f(eyeY - 9)} L${f(i)} ${f(eyeY - 5.2)} Q${f(ex)} ${f(eyeY - 4.6)} ${f(o)} ${f(eyeY - 0.2)}Z`, fill: C.face } });
      eyes.push({ t: "path", p: { d: `M${f(ex - 6 * s)} ${f(eyeY - 5)} Q${f(ex)} ${f(eyeY - 4.4)} ${f(ex + 6.3 * s)} ${f(eyeY - 0.8)}`, stroke: C.ink, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" } });
      eyes.push({ t: "circle", p: { cx: ex + 1.4, cy: eyeY + 0.6, r: 1.7, fill: "#fff" } });
      eyes.push({ t: "path", p: { d: `M${f(ex + 5 * s)} ${f(eyeY - 9.5)} Q${f(ex)} ${f(eyeY - 10.5)} ${f(ex - 4.5 * s)} ${f(eyeY - 13.5)}`, stroke: C.spineBack, strokeWidth: 2, fill: "none", strokeLinecap: "round" } });
    } else {
      eyes.push({ t: "circle", p: { cx: ex + 1.9, cy: eyeY - 2.6, r: 2.3, fill: "#fff" } });
      eyes.push({ t: "circle", p: { cx: ex - 1.8, cy: eyeY + 2.6, r: 1, fill: "#fff", opacity: 0.85 } });
    }
  }
  // tiny kilim scarf: pomegranate band with saffron lozenges and an indigo stitch line
  const scarfBand = "M31 89 Q60 101 89 89 L88.5 96.5 Q60 108.5 31.5 96.5Z";
  const lozenges: JNode[] = [44, 60, 76].map((x, i) => {
    const y = i === 1 ? 99 : 96.6; const r = 2.7;
    return { t: "path", p: { d: `M${x} ${f(y - r)} L${x + r} ${y} L${x} ${f(y + r)} L${x - r} ${y}Z`, fill: C.saffron } };
  });
  return [
    { t: "ellipse", p: { cx: 60, cy: 112, rx: 30, ry: 4.5, fill: C.shadow } },
    sp(back, C.spineBack, 6.5),
    sp(mid, C.spine, 6),
    { t: "circle", p: { cx, cy: cy + drop * 0.5, r: 32, fill: C.spine } },
    sp(front, C.spineTip, 5.5),
    // a few light flicks of quill texture
    { t: "path", p: { d: "M43 38 l3 4 M58 30 l1 4.5 M74 36 l-2 4 M33 52 l4 2.5 M86 51 l-4 2.5", stroke: C.flick, strokeWidth: 1.8, strokeLinecap: "round", fill: "none", opacity: sad ? 0.6 : 1 } },
    // ears
    { t: "circle", p: { cx: 35.5, cy: 52 + drop * 0.6, r: 6.8, fill: C.face } },
    { t: "circle", p: { cx: 84.5, cy: 52 + drop * 0.6, r: 6.8, fill: C.face } },
    { t: "circle", p: { cx: 35.8, cy: 52.6 + drop * 0.6, r: 3.6, fill: C.ear } },
    { t: "circle", p: { cx: 84.2, cy: 52.6 + drop * 0.6, r: 3.6, fill: C.ear } },
    // feet
    { t: "ellipse", p: { cx: 46, cy: 106.5, rx: 7.5, ry: 4.6, fill: C.feet } },
    { t: "ellipse", p: { cx: 74, cy: 106.5, rx: 7.5, ry: 4.6, fill: C.feet } },
    // face + belly (heart-topped, so the quills come down in a little widow's peak)
    { t: "path", p: { d: "M60 49 C67 42 86 45 90.5 64 C95 86 82 105 60 105 C38 105 25 86 29.5 64 C34 45 53 42 60 49Z", fill: C.face } },
    { t: "path", p: { d: "M33 86 C38 100 50 105 60 105 C70 105 82 100 87 86 C80 98 70 101 60 101 C50 101 40 98 33 86Z", fill: C.faceShade } },
    // cheeks
    { t: "ellipse", p: { cx: 39.5, cy: 80.5, rx: 5, ry: 3, fill: C.cheek, opacity: sad ? 0.18 : 0.38 } },
    { t: "ellipse", p: { cx: 80.5, cy: 80.5, rx: 5, ry: 3, fill: C.cheek, opacity: sad ? 0.18 : 0.38 } },
    ...eyes,
    // nose + mouth
    { t: "ellipse", p: { cx: 60, cy: 79.5, rx: 4.6, ry: 3.4, fill: C.ink } },
    { t: "ellipse", p: { cx: 58.6, cy: 78.5, rx: 1.5, ry: 0.9, fill: "#fff", opacity: 0.7 } },
    sad
      ? { t: "path", p: { d: "M55.5 88.5 Q60 84.8 64.5 88.5", stroke: C.ink, strokeWidth: 1.7, fill: "none", strokeLinecap: "round" } }
      : { t: "path", p: { d: "M55.5 84.6 Q57.8 87.6 60 84.8 Q62.2 87.6 64.5 84.6", stroke: C.ink, strokeWidth: 1.7, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } },
    ...(sad ? [{ t: "path", p: { d: "M41 77.5 Q38.4 81.6 41 83.4 Q43.6 81.6 41 77.5Z", fill: C.tear } } as JNode] : []),
    // scarf
    { t: "path", p: { d: scarfBand, fill: C.scarf } },
    { t: "path", p: { d: "M32 92.6 Q60 104.6 88 92.6", stroke: C.indigo, strokeWidth: 1, fill: "none", strokeDasharray: "2.2 1.6", opacity: 0.85 } },
    ...lozenges,
    { t: "path", p: { d: "M79.5 98 L86.5 96 L88.5 110 L82 111.5Z", fill: C.scarfDeep } },
    { t: "path", p: { d: "M82.6 111.3 l-0.6 2.6 M85 110.8 l0 2.6 M87.6 110.3 l0.6 2.5", stroke: C.saffron, strokeWidth: 1.3, strokeLinecap: "round" } },
  ];
}

const attr = (k: string) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
/** Serialise to a standalone SVG string (used by the icon rasteriser). */
export function jujiSvg(sad = false, opts: { size?: number; mono?: string; noShadow?: boolean; viewBox?: string } = {}): string {
  const s = opts.size ?? 120;
  // mono: a one-colour silhouette with the eyes, nose and mouth cut out (Android themed icon)
  const isFeature = (n: JNode) => n.p.fill === JUJI_COL.ink || n.p.stroke === JUJI_COL.ink;
  const ser = (n: JNode, cut = false): string => {
    const p = { ...n.p };
    if (opts.mono) { for (const k of ["fill", "stroke"]) if (p[k] && p[k] !== "none") p[k] = cut ? "#000" : "#fff"; delete p.opacity; }
    const a = Object.entries(p).map(([k, v]) => `${attr(k)}="${v}"`).join(" ");
    return n.c ? `<g ${a}>${n.c.map((c) => ser(c, cut)).join("")}</g>` : `<${n.t} ${a}/>`;
  };
  let nodes = jujiNodes(sad); if (opts.noShadow || opts.mono) nodes = nodes.slice(1);
  const vb = opts.viewBox ?? "0 0 120 120";
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="${vb}">`;
  if (opts.mono) {
    const body = nodes.filter((n) => n.p.fill !== JUJI_COL.ink && !(n.p.fill === "#fff"));
    const feat = nodes.filter(isFeature);
    return `${open}<defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">${body.map((n) => ser(n)).join("")}${feat.map((n) => ser(n, true)).join("")}</mask></defs><rect width="120" height="120" fill="${opts.mono}" mask="url(#m)"/></svg>`;
  }
  return `${open}${nodes.map((n) => ser(n)).join("")}</svg>`;
}
