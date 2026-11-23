import { Alegreya_500Medium_Italic, Alegreya_700Bold, Alegreya_700Bold_Italic, Alegreya_800ExtraBold } from "@expo-google-fonts/alegreya";
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initAudio } from "@/lib/audio";
import { t } from "@/lib/i18n";
import { hydrate, switchCourse, tick } from "@/lib/store";
import { startLeagueSync, syncLeague } from "@/lib/league";
import { scheduleReminders } from "@/lib/remind";
import type { ErrorBoundaryProps } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import { ConfettiHost, toast, ToastHost } from "@/ui/kit";
import { useTheme } from "@/ui/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const th = useTheme();
  const [ready, setReady] = useState(false);
  const [fonts] = useFonts({ Alegreya_500Medium_Italic, Alegreya_700Bold, Alegreya_700Bold_Italic, Alegreya_800ExtraBold, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  useEffect(() => {
    let stopLeague: (() => void) | null = null;
    (async () => {
      const frozen = await hydrate();
      await initAudio();
      setReady(true);
      scheduleReminders();
      stopLeague = startLeagueSync();
      if (frozen) setTimeout(() => toast(t("freezeUsed", { n: frozen })), 800);
    })();
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") { tick(); scheduleReminders(); syncLeague(); } });
    return () => { sub.remove(); stopLeague?.(); };
  }, []);
  useEffect(() => { SystemUI.setBackgroundColorAsync(th.bg).catch(() => {}); }, [th.bg]);
  useEffect(() => { if (ready && fonts) SplashScreen.hideAsync().catch(() => {}); }, [ready, fonts]);

  if (!ready || !fonts) return <View style={{ flex: 1, backgroundColor: th.bg }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: th.bg }}>
      <SafeAreaProvider>
        <StatusBar style={th.dark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: th.bg }, animation: "slide_from_right" }}>
          <Stack.Screen name="index" options={{ animation: "none" }} />
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="lesson" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
          <Stack.Screen name="story" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
          <Stack.Screen name="read" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="podcasts" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="episode" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="bridge" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="alpha" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="culture" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="league" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        </Stack>
        <ConfettiHost />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Instead of closing, show what went wrong and offer a way back to the Kurmancî course. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 14, backgroundColor: "#FBF6EC" }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: "#2A1F14" }}>Juji bir hatayla karşılaştı</Text>
      <Text selectable style={{ fontSize: 13, color: "#6B5A47" }}>{String(error?.message || error)}</Text>
      <Text selectable style={{ fontSize: 11, color: "#9A8A77" }}>{String(error?.stack || "").split("\n").slice(0, 6).join("\n")}</Text>
      <Pressable onPress={() => { try { switchCourse("kmr"); } catch {} retry(); }} style={{ padding: 14, borderRadius: 12, backgroundColor: "#3F7A4F" }}>
        <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>Kurmancî kursuna dön</Text>
      </Pressable>
      <Pressable onPress={retry} style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#C9B99F" }}>
        <Text style={{ color: "#2A1F14", fontWeight: "700", textAlign: "center" }}>Tekrar dene</Text>
      </Pressable>
    </ScrollView>
  );
}
