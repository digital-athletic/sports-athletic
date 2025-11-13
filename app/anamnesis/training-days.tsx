import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

/**
 * Training Days Screen
 *
 * User selects available training days.
 * Legacy: views/data/TrainingDays
 */
export default function TrainingDaysScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Training Days</Text>
      <Text variant="description">Select your available training days</Text>

      <Link href="/anamnesis/season-phase" asChild>
        <Button>Continue to Season Phase</Button>
      </Link>
    </Box>
  );
}
