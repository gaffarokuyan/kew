import { router } from "expo-router";
import { getS } from "@/lib/store";

/**
 * Juji Plus — optional subscription (7-day free trial, then monthly/yearly). Lessons always stay free.
 *
 * PLUS_ENABLED is the master switch. While it is false nothing is locked: every gate below lets the
 * learner through and no Plus entry point is shown. Turn it on only after:
 *   1. Google Play merchant account + subscription products `juji_plus_monthly` / `juji_plus_yearly`
 *      (each with a 7-day free-trial offer) exist in Play Console,
 *   2. billing (RevenueCat `react-native-purchases`, needs a dev/EAS build) writes `store.plus`,
 *   3. purchases are verified server side (Supabase function) so `plus.until` can't be faked.
 */
export const PLUS_ENABLED = false;

export const PLUS_PRODUCTS = { monthly: "juji_plus_monthly", yearly: "juji_plus_yearly" } as const;
export const TRIAL_DAYS = 7;

/** What Plus adds; shown on the Plus screen (free column = ✓ where the feature is also free). */
export const PLUS_FEATURES: { k: string; free: boolean }[] = [
  { k: "plusF_lessons", free: true },
  { k: "plusF_hearts", free: false },
  { k: "plusF_offline", free: false },
  { k: "plusF_practice", free: false },
  { k: "plusF_legend", free: false },
  { k: "plusF_chat", free: false },
  { k: "plusF_badge", free: false },
];

/** True when the learner has an active subscription or trial. */
export function hasPlus(): boolean {
  const p = getS().plus;
  return !!p && (p.until ?? 0) > Date.now();
}

/** Gate for a Plus feature: always open while Plus is switched off. */
export function plusAllows(): boolean {
  return !PLUS_ENABLED || hasPlus();
}

/** Use at a locked feature: lets the action run, or opens the Plus screen instead. */
export function requirePlus(run: () => void) {
  if (plusAllows()) run();
  else router.push("/plus");
}
