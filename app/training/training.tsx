import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

/**
 * Training Screen
 *
 * Active training execution screen.
 * Back gestures disabled to prevent accidental exits during training.
 * Legacy: views/training/Training
 */
export default function TrainingScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Training in Progress</Text>
      <Text variant="subtitle" marginBottom="xs">
        Execute your training exercises
      </Text>
      <Text variant="small" color="darkGrey1" marginBottom="xl">
        ⚠️ Gestures disabled - use buttons to navigate
      </Text>

      <Box width="100%" gap="m">
        <Link href="/training/training-success" asChild>
          <Button variant="success">Complete Training</Button>
        </Link>

        <Link href="/training/exercise-information" asChild>
          <Button variant="secondary">Exercise Info</Button>
        </Link>
      </Box>
    </Box>
  );
}
