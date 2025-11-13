import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

/**
 * Welcome Screen
 *
 * Welcome screen for new users starting the profile setup.
 * Legacy: views/data/Welcome
 */
export default function WelcomeScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Welcome</Text>
      <Text variant="description">
        Let&apos;s set up your profile and training plan
      </Text>

      <Link href="/anamnesis/sport" asChild>
        <Button>Get Started</Button>
      </Link>
    </Box>
  );
}
