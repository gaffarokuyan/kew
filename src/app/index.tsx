import { Redirect } from "expo-router";
import { getS } from "@/lib/store";

export default function Index() {
  return <Redirect href={getS().onboard ? "/(tabs)" : "/onboarding"} />;
}
