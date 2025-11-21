import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";
import { ViewWithTitle } from "../../src/common/ViewWithTitle";

/**
 * Onboarding WebView Screen
 *
 * Displays web content (AGB/Privacy Policy) during onboarding
 * Migrated from legacy OnboardingWebView
 */
export default function OnboardingWebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = () => {
    router.back();
  };

  return (
    <ViewWithTitle
      title={t("onboarding.webContent")}
      fixed={true}
      onBack={handleBack}
      backgroundColor="white"
    >
      {url && <WebView source={{ uri: url }} />}
    </ViewWithTitle>
  );
}
