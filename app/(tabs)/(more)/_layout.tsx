import { Stack } from "expo-router";

/**
 * Profile/More Stack Layout
 *
 * Profile hub with settings, exercises, tutorials, and more.
 * Legacy: MoreStack (Stack Navigator)
 */
export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: "minimal",
      }}
      initialRouteName="more"
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="exercise-information" />
      <Stack.Screen name="imprint" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="webview" />
      <Stack.Screen name="subscribe" />
      <Stack.Screen name="subscription-status" />
    </Stack>
  );
}
