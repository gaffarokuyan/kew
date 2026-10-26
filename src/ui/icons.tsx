import Svg, { Circle, Path } from "react-native-svg";

type P = { size?: number; color?: string; bg?: string };
const S = ({ size = 22, children }: { size?: number; children: React.ReactNode }) => <Svg width={size} height={size} viewBox="0 0 24 24">{children}</Svg>;

export const Icon = {
  fire: ({ size, color = "#E0702A" }: P) => <S size={size}><Path fill={color} d="M12 2c1 3.5 5 5.6 5 10.5A5 5 0 0 1 12 22a5 5 0 0 1-5-5c0-2.6 1.6-4 2.6-5.6.3 1.8 1.2 2.6 2.2 2.6 0-3.4-.6-6.4.2-12Z" /><Path fill="#F6C65B" d="M12 13c1 1.5 2.4 2.2 2.4 4.2a2.4 2.4 0 0 1-4.8 0c0-1.3.9-2.1 1.4-2.8.2.6.6 1 1 1-.2-.9-.2-1.6 0-2.4Z" /></S>,
  gem: ({ size, color = "#34488F" }: P) => <S size={size}><Path fill={color} d="M7 3h10l5 6-10 12L2 9z" /><Path fill="#fff" opacity={0.35} d="M7 3 5 9h7zm10 0 2 6h-7z" /></S>,
  heart: ({ size, color = "#B83440" }: P) => <S size={size}><Path fill={color} d="M12 21s-8.5-5.4-8.5-11.4A4.7 4.7 0 0 1 12 6.8a4.7 4.7 0 0 1 8.5 2.8C20.5 15.6 12 21 12 21Z" /></S>,
  star: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="m12 2.6 2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z" /></S>,
  check: ({ size, color = "#fff" }: P) => <S size={size}><Path fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></S>,
  lock: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z" /></S>,
  x: ({ size, color = "#000" }: P) => <S size={size}><Path fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></S>,
  book: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5a1.5 1.5 0 0 0 0 3H20v1H6.5A2.5 2.5 0 0 1 4 19.5z" /></S>,
  chat: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></S>,
  story: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M3 5c3-1.5 6-1.5 9 .5 3-2 6-2 9-.5v14c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z" /></S>,
  spk: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M4 9h4l5-4v14l-5-4H4z" /><Path fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></S>,
  turtle: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M4 15a7 6 0 0 1 14 0zm14-2 3-1a1.5 1.5 0 0 1 0 3h-2.5zM6 15l-1 3h2.5l.8-3zm8 0 .8 3h2.5l-1-3z" /></S>,
  /* Zagros ridge with a footpath winding up it: the learning path. */
  path: ({ size, color = "#000", bg = "#fff" }: P) => <S size={size}><Path fill={color} d="M1.5 20.5 8.2 8.8l2.7 4.3 3.4-6.6 8.2 14z" /><Path fill="none" stroke={bg} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="1.2 2.2" d="M9.5 20c2.5-1.5 1-3 3.5-4.2 1.6-.8 1.4-2.4 1.4-4" /></S>,
  dumbbell: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="M2 10h2V8h3v8H4v-2H2zm20 0h-2V8h-3v8h3v-2h2zM8 11h8v2H8z" /></S>,
  /* An open notebook — the learner's own word list. */
  words: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="M2 5.5C4.8 4.3 8 4.4 11 6.2V20c-3-1.6-6.2-1.8-9-.6zm20 0c-2.8-1.2-6-1.1-9 .7V20c3-1.6 6.2-1.8 9-.6z" /></S>,
  user: ({ size, color = "#000" }: P) => <S size={size}><Circle cx={12} cy={8} r={4.5} fill={color} /><Path fill={color} d="M3 21a9 7 0 0 1 18 0z" /></S>,
  gear: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="m13.7 2 .5 2.6 1.8.8 2.3-1.4 2.4 2.4-1.4 2.3.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.4 2.3-2.4 2.4-2.3-1.4-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.3 1.4-2.4-2.4 1.4-2.3-.8-1.8L2 13.7v-3.4l2.6-.5.8-1.8-1.4-2.3 2.4-2.4 2.3 1.4 1.8-.8.5-2.6zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /></S>,
  ear: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="M12 2a7 7 0 0 0-7 7h3a4 4 0 0 1 8 0c0 2-1.4 2.8-2.6 3.8-1.2 1-2.4 2-2.4 4.2a2 2 0 0 1-4 0H4a5 5 0 0 0 10 0c0-.9.5-1.4 1.6-2.3C17 13.5 19 12 19 9a7 7 0 0 0-7-7Z" /></S>,
  bolt: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="M13 2 4 14h6l-1 8 9-12h-6z" /></S>,
  target: ({ size, color = "#000" }: P) => <S size={size}><Circle cx={12} cy={12} r={10} fill={color} /><Circle cx={12} cy={12} r={6} fill="#fff" opacity={0.55} /><Circle cx={12} cy={12} r={2.5} fill={color} /></S>,
  trophy: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="M6 3h12v3h3a4 4 0 0 1-4.3 4A6 6 0 0 1 13 13.9V17h4v4H7v-4h4v-3.1A6 6 0 0 1 7.3 10 4 4 0 0 1 3 6h3zm-1 5a2 2 0 0 0 1.3 1V5H5z" /></S>,
  ice: ({ size, color = "#000" }: P) => <S size={size}><Path fill={color} d="M11 2h2v5l3-2 1 1.7-4 2.5V11h2.8l2.5-4 1.7 1-2 3H22v2h-5l2 3-1.7 1-2.5-4H13v1.8l4 2.5L16 19l-3-2v5h-2v-5l-3 2-1-1.7 4-2.5V13H8.2l-2.5 4L4 16l2-3H2v-2h5L5 8l1.7-1 2.5 4H11V9.2L7 6.7 8 5l3 2z" /></S>,
  redo: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} d="M12 4a8 8 0 1 0 8 8h-3a5 5 0 1 1-5-5v3l5-4.5L12 1z" /></S>,
  jump: ({ size, color = "#fff" }: P) => <S size={size}><Path fill={color} opacity={0.35} d="M4 20h4v-6H4zm6 0h4v-10h-4zm6 0h4V4h-4z" /><Path fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" d="M4 12 Q10 0 19 6m0 0-4.5-.5M19 6l-1 4.4" /></S>,
};
