import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";

/**
 * Onboarding WebView Screen
 *
 * Displays web content (AGB/Privacy Policy) during onboarding
 * Migrated from legacy OnboardingWebView
 */
export default function OnboardingWebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: t("onboarding.webContent") }}
      />
      {url && (
        <WebView
          source={{ uri: url }}
          contentInsetAdjustmentBehavior="automatic"
        />
      )}
    </>
  );
}
