import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Link } from "expo-router";
import { ActivityIndicator } from "react-native";

/**
 * Generating Screen
 *
 * Training plan generation loading screen.
 * Legacy: views/data/Generating
 */
export default function GeneratingScreen() {
  const { colors } = useTheme();
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <ActivityIndicator size="large" color={colors.primary} />
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
