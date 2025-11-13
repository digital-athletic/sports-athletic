import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";
import { ActivityIndicator } from "react-native";

/**
 * Generating Screen
 *
 * Training plan generation loading screen.
 * Legacy: views/data/Generating
 */
export default function GeneratingScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <ActivityIndicator size="large" color="#007AFF" />
      <Text variant="title" marginTop="l">
        Generating Training Plan
      </Text>
      <Text variant="description">
        Creating your personalized training plan...
      </Text>

      <Link href="/(tabs)" replace asChild>
        <Button>Complete Setup</Button>
      </Link>
    </Box>
  );
}
