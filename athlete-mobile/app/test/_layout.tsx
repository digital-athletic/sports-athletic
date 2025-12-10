import { Stack } from "expo-router";

/**
 * Test Stack Layout
 *
 * Development and testing screens.
 * Legacy: TestStack (Stack Navigator)
 */
export default function TestStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="test-training" />
    </Stack>
  );
}
