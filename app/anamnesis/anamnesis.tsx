import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

/**
 * Anamnesis Screen
 *
 * Health questionnaire for personalized training plans.
 * Legacy: views/data/Anamnesis
 */
export default function AnamnesisScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Health Questionnaire</Text>
      <Text variant="description">
        Answer questions about your health and fitness
      </Text>

      <Link href="/anamnesis/training-days" asChild>
        <Button>Continue to Training Days</Button>
      </Link>
    </Box>
  );
}
