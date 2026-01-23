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
    />
  );
}
