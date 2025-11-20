import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { ScrollView } from "react-native";

/**
 * Statistics Screen
 *
 * User statistics and progress tracking.
 * Legacy: views/statistics/Statistics
 */
export default function StatisticsScreen() {
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="lightGrey1">
        <Text variant="title" marginTop="l" marginBottom="xs">
          Statistics
        </Text>
        <Text variant="subtitle" marginBottom="xl">
          Track your training progress
        </Text>

        <Box flexDirection="row" flexWrap="wrap" gap="m" marginBottom="xl">
          <Card variant="elevated" flex={1} minWidth={150} alignItems="center">
            <Text
              fontSize={36}
              fontWeight="bold"
              color="primary"
              marginBottom="xs"
            >
              0
            </Text>
            <Text variant="small" textAlign="center">
              Trainings Completed
            </Text>
          </Card>

          <Card variant="elevated" flex={1} minWidth={150} alignItems="center">
            <Text
              fontSize={36}
              fontWeight="bold"
              color="primary"
              marginBottom="xs"
            >
              0
            </Text>
            <Text variant="small" textAlign="center">
              Total Hours
            </Text>
          </Card>

          <Card variant="elevated" flex={1} minWidth={150} alignItems="center">
            <Text
              fontSize={36}
              fontWeight="bold"
              color="primary"
              marginBottom="xs"
            >
              0
            </Text>
            <Text variant="small" textAlign="center">
              Current Streak
            </Text>
          </Card>

          <Card variant="elevated" flex={1} minWidth={150} alignItems="center">
            <Text
              fontSize={36}
              fontWeight="bold"
              color="primary"
              marginBottom="xs"
            >
              0
            </Text>
            <Text variant="small" textAlign="center">
              Exercises Done
            </Text>
          </Card>
        </Box>

        <Card variant="elevated">
          <Text variant="cardTitle">Progress Overview</Text>
          <Text variant="body" lineHeight={20}>
            Your training statistics and progress tracking will be displayed
            here. This includes completed trainings, total hours, streaks, and
            more.
          </Text>
        </Card>
      </Box>
    </ScrollView>
  );
}
