import { Stack } from "expo-router";

/**
 * Home Stack Layout
 *
 * Nested stack navigator within the Home tab for section details.
 * Legacy: HomeStack (Stack Navigator)
 */
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="section-details" />
    </Stack>
  );
}
