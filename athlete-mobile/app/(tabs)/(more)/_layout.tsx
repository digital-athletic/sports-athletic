import { Stack } from "expo-router";

/**
 * Profile/More Stack Layout
 *
 * Profile hub with settings, exercises, tutorials, and more.
 * Legacy: MoreStack (Stack Navigator)
 */
export const unstable_settings = {
  anchor: "more",
};

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
