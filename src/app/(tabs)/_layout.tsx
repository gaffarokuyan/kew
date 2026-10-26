import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sfx } from "@/lib/audio";
import { t, useLang } from "@/lib/i18n";
import { Icon } from "@/ui/icons";
import { TopBar } from "@/ui/TopBar";
import { Diamond } from "@/ui/art";
import { buzz } from "@/ui/haptics";
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
        <View style={{ flexDirection: "row", paddingHorizontal: 8, paddingTop: 4, paddingBottom: 6 + ins.bottom, backgroundColor: th.bg, borderTopWidth: 1, borderColor: th.line }}>
          {state.routes.map((r, i) => {
            const on = state.index === i; const tab = TABS.find((x) => x.name === r.name)!; const Ic = tab.icon;
            return (
              <Pressable key={r.key} onPress={() => { sfx("tap"); if (!on) { buzz("select"); navigateToTab(r.key); } }} accessibilityRole="tab" accessibilityLabel={t(tab.label)} accessibilityState={{ selected: on }}
                style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 56, gap: 2, opacity: pressed ? 0.7 : 1 })}>
                <View style={{ height: 8, justifyContent: "center" }}>{on ? <Diamond size={8} color={th.zer} /> : null}</View>
                <Ic size={26} color={on ? th.ink : th.faint} bg={th.bg} />
                <Text style={{ fontFamily: on ? F.bodyHeavy : F.body, fontSize: 12, color: on ? th.ink : th.muted }}>{t(tab.label)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}>
      {TABS.map((x) => <Tabs.Screen key={x.name} name={x.name} />)}
    </Tabs>
  );
}
