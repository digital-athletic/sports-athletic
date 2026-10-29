import { BackHeader } from "@/common/BackHeader";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";

/**
 * WebView Screen (Full-Screen Modal)
 *
 * Full-screen web content viewing modal.
 * Legacy: WebViewStack > WebView
 */
export default function WebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("onboarding.webContent"),
          headerLeft: () => <BackHeader />,
        }}
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
