import { Box, Button, Card, Text } from "@/components";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

/**
 * Home Screen (Training Tab)
 *
 * Main training dashboard showing available training sections.
 * Legacy: views/home/Home (HomeStack initial route)
 */
export default function HomeScreen() {
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="lightGrey1">
        <Text variant="title" marginTop="l" marginBottom="xs">
          Training Home
        </Text>
        <Text variant="subtitle" marginBottom="xl">
          Your personalized training dashboard
        </Text>

        <Box gap="l">
          <Card variant="elevated">
            <Text variant="cardTitle">Today&apos;s Training</Text>
            <Text variant="body" marginBottom="m">
              Start your daily workout
            </Text>
            <Link href="/training" asChild>
              <Button>Start Training</Button>
            </Link>
          </Card>

          <Card variant="elevated">
            <Text variant="cardTitle">Training Sections</Text>
            <Text variant="body" marginBottom="m">
              Browse training categories
            </Text>
            <Link href="/home/section-details" asChild>
              <Button>View Sections</Button>
            </Link>
          </Card>

          <Card variant="elevated">
            <Text variant="cardTitle">Quick Actions</Text>
            <Box flexDirection="row" flexWrap="wrap" gap="s" marginTop="s">
              <Link href="/webview">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={100}
                  alignItems="center"
                >
                  <Text variant="link">Web View</Text>
                </Box>
              </Link>
              <Link href="/video-player">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={100}
                  alignItems="center"
                >
                  <Text variant="link">Video Player</Text>
                </Box>
              </Link>
              <Link href="/contact">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={100}
                  alignItems="center"
                >
                  <Text variant="link">Contact</Text>
                </Box>
              </Link>
            </Box>
          </Card>
        </Box>
      </Box>
    </ScrollView>
  );
}
