import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Training Overview Screen
 *
 * Overview of the training session before starting.
 * Legacy: views/training/TrainingOverview
 */
export default function TrainingOverviewScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Training Overview</Text>
      <Text variant="description">Review your training plan</Text>

      <Box width="100%" gap="m">
        <Link href="/training/training" asChild>
          <Button>Start Active Training</Button>
        </Link>

        <Link href="/training/exercise-information" asChild>
          <Button variant="secondary">Exercise Info</Button>
        </Link>
      </Box>
    </Box>
  );
}
