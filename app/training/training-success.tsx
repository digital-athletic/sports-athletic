import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Training Success Screen
 *
 * Training completion summary and celebration.
 * Back gestures disabled to ensure controlled flow.
 * Legacy: views/training/TrainingSuccess
 */
export default function TrainingSuccessScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text fontSize={64} marginBottom="l">
        🎉
      </Text>
      <Text variant="title">Training Complete!</Text>
      <Text variant="subtitle" marginBottom="xs">
        Great job completing your training session
      </Text>
      <Text variant="small" color="darkGrey1" marginBottom="xl">
        ⚠️ Gestures disabled - use buttons to navigate
      </Text>

      <Box width="100%" gap="m">
        <Link href="/(tabs)/(home)" replace asChild>
          <Button variant="success">Back to Home</Button>
        </Link>
      </Box>
    </Box>
  );
}
