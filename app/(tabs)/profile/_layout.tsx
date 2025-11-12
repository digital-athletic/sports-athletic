import { Stack } from "expo-router";

/**
 * Profile/More Stack Layout
 *
 * Profile hub with settings, exercises, tutorials, and more.
 * Legacy: MoreStack (Stack Navigator)
 */
export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="exercise-information" />
      <Stack.Screen name="tutorials" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="imprint" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="webview" />
      <Stack.Screen name="subscribe" />
      <Stack.Screen name="subscription-status" />
    </Stack>
  );
}
