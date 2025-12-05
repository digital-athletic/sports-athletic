import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { Link, Stack } from "expo-router";
import { ScrollView } from "react-native";

/**
 * Section Details Screen
 *
 * Detailed view of a training section with exercises and information.
 * Legacy: views/home/pages/SectionDetails
 */
export default function SectionDetailsScreen() {
  return (
    <>
      <Stack.Screen />
      <ScrollView>
        <Box flexGrow={1} padding="l" backgroundColor="white">
          <Text variant="title" marginTop="xxl" marginBottom="s">
            Section Details
          </Text>
          <Text variant="description" marginBottom="xl">
            Detailed view of training sections with exercises and instructions
          </Text>

          <Card variant="flat" marginBottom="xl">
            <Text variant="cardTitle" marginBottom="s">
              Training Section Information
            </Text>
            <Text variant="body" lineHeight={20}>
              This screen would display detailed information about a specific
              training section, including exercises, duration, difficulty, and
              instructions.
            </Text>
          </Card>

          <Box gap="m">
            <Link href="/training" asChild>
              <Button>Start This Section</Button>
            </Link>

            <Link href="../" asChild>
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </Box>
        </Box>
      </ScrollView>
    </>
  );
}
