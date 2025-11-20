import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

/**
 * Exercise Information Screen
 *
 * Detailed information about exercises.
 * Accessible from training overview and active training screens.
 * Legacy: views/training/ExerciseInformation
 */
export default function ExerciseInformationScreen() {
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="white">
        <Text variant="title" marginTop="xxl" marginBottom="s">
          Exercise Information
        </Text>
        <Text variant="description">
          Detailed instructions and tips for exercises
        </Text>

        <Card variant="flat" marginBottom="xl">
          <Text variant="cardTitle">Exercise Details</Text>
          <Text variant="body" lineHeight={20}>
            This screen would display detailed information about the selected
            exercise, including proper form, common mistakes, and video
            demonstrations.
          </Text>
        </Card>

        <Link href="../" asChild>
          <Button>Back to Training</Button>
        </Link>
      </Box>
    </ScrollView>
  );
}
