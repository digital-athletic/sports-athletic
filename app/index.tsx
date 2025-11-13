import { Box, Button, Card, Text } from "@/components";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

/**
 * Root Index Screen
 *
 * Entry point for navigation - simulates the Switch Navigator logic
 * from the legacy app. In production, this would check user state
 * and automatically route to the appropriate flow.
 */
export default function IndexScreen() {
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="lightGrey1">
        <Text
          variant="title"
          textAlign="center"
          marginTop="xxl"
          marginBottom="xs"
          color="primary"
        >
          Sports Athletic
        </Text>
        <Text variant="subtitle" textAlign="center" marginBottom="s">
          Navigation Demo
        </Text>
        <Text variant="description" textAlign="center" marginBottom="xl">
          Select a flow to explore the navigation hierarchy
        </Text>

        <Box gap="l">
          <Card variant="elevated">
            <Text variant="cardTitle">🎯 Main App Flow</Text>
            <Text variant="body" marginBottom="m" lineHeight={20}>
              Navigate to the main tab-based interface with Home, Statistics,
              and Profile tabs.
            </Text>
            <Link href="/(tabs)" asChild>
              <Button>Go to Main App</Button>
            </Link>
          </Card>

          <Card variant="elevated">
            <Text variant="cardTitle">👋 Onboarding Flow</Text>
            <Text variant="body" marginBottom="m" lineHeight={20}>
              First-time user experience and app introduction.
            </Text>
            <Link href="/onboarding" asChild>
              <Button>Start Onboarding</Button>
            </Link>
          </Card>

          <Card variant="elevated">
            <Text variant="cardTitle">📋 Anamnesis Flow</Text>
            <Text variant="body" marginBottom="m" lineHeight={20}>
              User profile setup and health questionnaire.
            </Text>
            <Link href="/anamnesis" asChild>
              <Button>Start Anamnesis</Button>
            </Link>
          </Card>

          <Card variant="elevated">
            <Text variant="cardTitle">💪 Training Flow</Text>
            <Text variant="body" marginBottom="m" lineHeight={20}>
              Active training session with navigation buttons (Select → Soreness
              → Overview → Training → Success).
            </Text>
            <Link href="/training" asChild>
              <Button>Start Training</Button>
            </Link>
          </Card>

          <Card variant="elevated">
            <Text variant="cardTitle">🧪 Other Flows</Text>
            <Text variant="body" marginBottom="s" lineHeight={20}>
              Access test screens, web view, video player, and contact modal.
            </Text>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              <Link href="/test">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={80}
                  alignItems="center"
                >
                  <Text variant="link">Test</Text>
                </Box>
              </Link>
              <Link href="/webview">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={80}
                  alignItems="center"
                >
                  <Text variant="link">WebView</Text>
                </Box>
              </Link>
              <Link href="/video-player">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={80}
                  alignItems="center"
                >
                  <Text variant="link">Video</Text>
                </Box>
              </Link>
              <Link href="/contact">
                <Box
                  backgroundColor="lightGrey2"
                  padding="s"
                  borderRadius="m"
                  minWidth={80}
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
