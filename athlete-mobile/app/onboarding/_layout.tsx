import { Stack } from "expo-router";

/**
 * Onboarding Stack Layout
 *
 * Handles the first-time user experience and app introduction.
 * Protected by Stack.Protected in root layout (only accessible when not authenticated).
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
