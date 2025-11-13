import { Box, Button, Text } from "@/components";
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
      backgroundColor="mainBackground"
    >
      <Text variant="title">Onboarding WebView</Text>
      <Text variant="description">Web content during onboarding flow</Text>

      <Link href="../" asChild>
        <Button variant="secondary">Go Back</Button>
      </Link>
    </Box>
  );
}
