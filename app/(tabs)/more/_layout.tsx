import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

/**
 * Profile/More Stack Layout
 *
 * Profile hub with settings, exercises, tutorials, and more.
 * Legacy: MoreStack (Stack Navigator)
 */
export default function ProfileStackLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="index"
        options={{
          title: t("screens.more.title"),
        }}
      />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="exercise-information" />
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
