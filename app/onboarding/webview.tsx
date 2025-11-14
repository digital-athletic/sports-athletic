import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Onboarding WebView Screen
 *
 * Displays web content during onboarding.
 * Legacy: views/webview/WebViewContainer (in OnboardingStack)
 */
export default function OnboardingWebViewScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Onboarding WebView</Text>
      <Text variant="description">Web content during onboarding flow</Text>

      <Link href="../" asChild>
        <Button variant="secondary">Go Back</Button>
      </Link>
    </Box>
  );
}
