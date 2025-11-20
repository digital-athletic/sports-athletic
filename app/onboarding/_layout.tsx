import { Stack } from "expo-router";

/**
 * Onboarding Stack Layout
 *
 * Handles the first-time user experience and app introduction.
 * Legacy: OnboardingStack (Stack Navigator)
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
