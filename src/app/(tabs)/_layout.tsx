import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { t, useLang } from "@/lib/i18n";
import { Icon } from "@/ui/icons";
import { TopBar } from "@/ui/TopBar";
import { F, useTheme } from "@/ui/theme";

const TABS = [
  { name: "index", label: "learn", icon: Icon.path },
  { name: "practice", label: "practice", icon: Icon.dumbbell },
  { name: "words", label: "words", icon: Icon.words },
  { name: "profile", label: "profile", icon: Icon.user },
] as const;

export default function TabsLayout() {
  const th = useTheme(); const ins = useSafeAreaInsets(); useLang();
  return (
    <Tabs
      screenOptions={{ header: () => <TopBar />, sceneStyle: { backgroundColor: th.bg } }}
      tabBar={({ state, navigateToTab }) => (
        <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 + ins.bottom, backgroundColor: th.bg, borderTopWidth: 2, borderColor: th.line }}>
          {state.routes.map((r, i) => {
            const on = state.index === i; const tab = TABS.find((x) => x.name === r.name)!; const Ic = tab.icon;
            return (
              <Pressable key={r.key} onPress={() => { sfx("tap"); if (!on) navigateToTab(r.key); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
                style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 7, borderRadius: 14, borderWidth: 2, borderColor: on ? th.sky : "transparent", backgroundColor: on ? th.skySoft : "transparent" }}>
                <Ic size={24} color={on ? th.sky : th.faint} />
                <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 0.6, color: on ? th.sky : th.faint }}>{t(tab.label)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}>
      {TABS.map((x) => <Tabs.Screen key={x.name} name={x.name} />)}
    </Tabs>
  );
}
