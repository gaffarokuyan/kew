import { Pressable, Text, View } from "react-native";
import type { Script } from "@/lib/course";
import { t } from "@/lib/i18n";
import { setCkbScript, useS } from "@/lib/store";
import { Sheet } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

const OPTS: { v: Script; ar?: string; lat?: string }[] = [
  { v: "ar", ar: "سڵاو، چۆنی؟" },
  { v: "lat", lat: "Sillaw, çonî?" },
  { v: "both", ar: "سڵاو، چۆنی؟", lat: "Sillaw, çonî?" },
];

/** Asks which alphabet the learner wants for Soranî: Arabic-based Kurdish, Latin, or both. */
export function ScriptPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <Sheet visible={visible} onClose={onClose}><ScriptOptions onPick={(m) => { setCkbScript(m); onClose(); }} /></Sheet>;
}

/** The alphabet choices themselves, usable inside any sheet. */
export function ScriptOptions({ onPick }: { onPick: (m: Script) => void }) {
  const th = useTheme(); const s = useS();
  return (
    <>
      <Text style={{ fontFamily: F.display, fontSize: TS.xl, color: th.ink }}>{t("scriptQ")}</Text>
      <Text style={{ fontFamily: F.body, color: th.muted }}>{t("scriptNote")}</Text>
      {OPTS.map((o) => {
        const on = (s.ckbScript || "both") === o.v && !!s.ckbScript;
        return (
          <Pressable key={o.v} onPress={() => onPick(o.v)} accessibilityRole="button" accessibilityLabel={t(o.v === "ar" ? "scriptAr" : o.v === "lat" ? "scriptLat" : "scriptBoth")}
            style={{ gap: 4, padding: 14, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: on ? 2 : 1.5, borderBottomWidth: 4, borderColor: on ? th.kesk : th.line2, backgroundColor: on ? th.keskSoft : th.surface }}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: TS.md, color: th.ink }}>{t(o.v === "ar" ? "scriptAr" : o.v === "lat" ? "scriptLat" : "scriptBoth")}</Text>
            {o.ar ? <Text style={{ fontFamily: F.serif, fontSize: 24, lineHeight: 34, color: th.ink, textAlign: "right" }}>{o.ar}</Text> : null}
            {o.lat ? <Text style={{ fontFamily: o.ar ? F.italic : F.serif, fontSize: o.ar ? 15 : 22, color: o.ar ? th.muted : th.ink, textAlign: o.ar ? "right" : "left" }}>{o.lat}</Text> : null}
          </Pressable>);
      })}
    </>
  );
}
