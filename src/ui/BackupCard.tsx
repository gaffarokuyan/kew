import { useState } from "react";
import { Platform, Share, Switch, Text, TextInput, View } from "react-native";
import { backupNow, fmtCode, restore, setAuto } from "@/lib/backup";
import { t } from "@/lib/i18n";
import { useS } from "@/lib/store";
import { buzz } from "@/ui/haptics";
import { Btn, toast } from "@/ui/kit";
import { F, TS, useTheme } from "@/ui/theme";

const ago = (at?: number) => {
  if (!at) return "";
  const m = Math.round((Date.now() - at) / 60000);
  return m < 1 ? t("bkNow") : m < 60 ? t("bkMin", { n: m }) : m < 1440 ? t("bkHour", { n: Math.round(m / 60) }) : new Date(at).toLocaleDateString();
};

/** Restore form: type the recovery code; tapping twice confirms (the device's progress is replaced). */
export function RestoreForm({ onDone }: { onDone?: () => void }) {
  const th = useTheme(); const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [sure, setSure] = useState(false);
  const go = async () => {
    if (code.replace(/[^A-Z0-9]/gi, "").length !== 12) { toast(t("bkBadCode")); return; }
    if (!sure) { setSure(true); return; }
    setBusy(true); const e = await restore(code); setBusy(false); setSure(false);
    if (e) { buzz("bad"); toast(e === "not found" ? t("bkNotFound") : e === "net" ? t("bkNet") : t("bkBadCode")); return; }
    buzz("win"); toast(t("bkRestored")); onDone?.();
  };
  return (
    <View style={{ gap: 10 }}>
      <TextInput value={code} onChangeText={(v) => { setSure(false); setCode(fmtCode(v).slice(0, 14)); }} autoCapitalize="characters" autoCorrect={false} placeholder="XXXX-XXXX-XXXX" placeholderTextColor={th.faint}
        accessibilityLabel={t("bkCode")} onSubmitEditing={go}
        style={{ fontFamily: F.bodyHeavy, fontSize: 22, letterSpacing: 3, textAlign: "center", color: th.ink, paddingVertical: 12, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: th.line2, backgroundColor: th.surface }} />
      <Btn title={busy ? "…" : sure ? t("bkRestoreSure") : t("bkRestore")} kind={sure ? "bad" : "sky"} disabled={busy || !code} onPress={go} />
    </View>);
}

/** Settings card: turn on backup, see/share the code, auto on/off, restore on this device. */
export function BackupCard() {
  const th = useTheme(); const s = useS(); const b = s.backup;
  const [busy, setBusy] = useState(false); const [showRestore, setShowRestore] = useState(false);
  const now = async () => { setBusy(true); const e = await backupNow(); setBusy(false); if (e) toast(e === "net" ? t("bkNet") : t("bkFail")); else { buzz("ok"); toast(t("bkSaved")); } };
  return (
    <View style={{ gap: 12 }}>
      {!b ? <>
        <Text style={{ fontFamily: F.body, fontSize: TS.sm, lineHeight: 20, color: th.muted }}>{t("bkIntro")}</Text>
        <Btn title={busy ? "…" : t("bkTurnOn")} kind="sky" disabled={busy} onPress={now} />
      </> : <>
        <View style={{ alignItems: "center", gap: 4, padding: 12, borderRadius: 12, backgroundColor: th.zerSoft }}>
          <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 1, color: th.zerDeep }}>{t("bkCode").toLocaleUpperCase()}</Text>
          <Text selectable style={{ fontFamily: F.bodyHeavy, fontSize: 26, letterSpacing: 3, color: th.ink }}>{fmtCode(b.code)}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 12, lineHeight: 17, color: th.zerDeep, textAlign: "center" }}>{t("bkKeep")}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {Platform.OS !== "web" ? <Btn title={t("lgShare")} kind="ghost" style={{ flex: 1 }} onPress={() => Share.share({ message: t("bkShareMsg", { c: fmtCode(b.code) }) }).catch(() => {})} /> : null}
          <Btn title={busy ? "…" : t("bkNowBtn")} kind="sky" style={{ flex: 1 }} disabled={busy} onPress={now} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 16, color: th.ink }}>{t("bkAuto")}</Text>
            {b.at ? <Text style={{ fontFamily: F.body, fontSize: 12, color: th.muted }}>{t("bkLast", { t: ago(b.at) })}</Text> : null}
          </View>
          <Switch value={b.auto} onValueChange={setAuto} trackColor={{ true: th.kesk }} />
        </View>
      </>}
      {showRestore ? <RestoreForm onDone={() => setShowRestore(false)} />
        : <Btn title={t("bkHaveCode")} kind="ghost" upper={false} onPress={() => setShowRestore(true)} />}
    </View>);
}
