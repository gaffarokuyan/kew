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
import { hydrate, tick } from "@/lib/store";
import { ConfettiHost, toast, ToastHost } from "@/ui/kit";
import { useTheme } from "@/ui/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const th = useTheme();
  const [ready, setReady] = useState(false);
  const [fonts] = useFonts({ Alegreya_500Medium_Italic, Alegreya_700Bold, Alegreya_700Bold_Italic, Alegreya_800ExtraBold, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  useEffect(() => {
    (async () => {
      const frozen = await hydrate();
      await initAudio();
      setReady(true);
      if (frozen) setTimeout(() => toast(t("freezeUsed", { n: frozen })), 800);
    })();
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") tick(); });
    return () => sub.remove();
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
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        </Stack>
        <ConfettiHost />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
