import { Stack } from "expo-router";

/**
 * Statistics Stack Layout
 *
 * Statistics and progress tracking screens.
 * Legacy: StatisticsStack (Stack Navigator)
 */
export default function StatisticsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
