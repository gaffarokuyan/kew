import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Small, quiet haptic vocabulary. No-ops on web. */
export function buzz(kind: "tap" | "select" | "ok" | "bad" | "win") {
  if (Platform.OS === "web") return;
  const p =
    kind === "tap" ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    : kind === "select" ? Haptics.selectionAsync()
    : kind === "ok" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : kind === "bad" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  p.catch(() => {});
}
