import { Alert } from "@/common/Alert";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Linking, Platform } from "react-native";

type WebViewRoute = "/webview" | "/onboarding/webview";

/**
 * Opens a legal document such as the privacy policy. The native app shows the
 * document on the given WebView route. Web opens the document in a new browser
 * tab because react-native-webview has no web version.
 */
export const useOpenLegalLink = (webViewRoute: WebViewRoute) => {
  const router = useRouter();
  const { t } = useTranslation();

  const openLegalLink = (url: string) => {
    if (!url) return;

    if (Platform.OS === "web") {
      Linking.openURL(url).catch(() => {
        Alert.alert(t("more.linkError.title"), t("more.linkError.message"));
      });
      return;
    }

    router.push(`${webViewRoute}?url=${encodeURIComponent(url)}`);
  };

  return { openLegalLink };
};
