import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

/**
 * Muscle Soreness Screen
 *
 * User reports muscle soreness before training.
 * Legacy: views/training/MuscleSoreness
 */
export default function MuscleSorenessScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Muscle Soreness</Text>
      <Text variant="description">
        Report any muscle soreness before training
      </Text>

      <Box width="100%" gap="m">
        <Link href="/training/training-overview" asChild>
          <Button>Continue to Overview</Button>
        </Link>

        <Link href="../" asChild>
          <Button variant="secondary">Back</Button>
        </Link>
      </Box>
    </Box>
  );
}
