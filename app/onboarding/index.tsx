import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Onboarding Screen
 *
 * Main onboarding screen for first-time users.
 * Legacy: views/onboarding/Onboarding
 */
export default function OnboardingScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Onboarding</Text>
      <Text variant="description">
        First-time user experience and app introduction
      </Text>

      <Box width="100%" gap="m" marginTop="l">
        <Link href="/onboarding/webview" asChild>
          <Button>View Web Content</Button>
        </Link>

        <Link href="/anamnesis" asChild>
          <Button>Continue to Anamnesis</Button>
        </Link>
      </Box>
    </Box>
  );
}
