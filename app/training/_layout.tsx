import { Stack } from "expo-router";

/**
 * Training Stack Layout
 *
 * Active training session management flow.
 * Gestures disabled on key screens to prevent accidental navigation.
 * Legacy: TrainingStack (Stack Navigator)
 */
export default function TrainingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="muscle-soreness" />
      <Stack.Screen
        name="training-overview"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="training" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="training-success"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="exercise-information" />
    </Stack>
  );
}
