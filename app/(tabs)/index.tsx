import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

/**
 * Home Screen (Training Tab)
 *
 * Main training dashboard showing available training sections.
 * Legacy: views/home/Home (HomeStack initial route)
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="lightGrey1">
        <Text variant="title" marginTop="l" marginBottom="xs">
          {t("screens.home.title")}
        </Text>
        <Text variant="subtitle" marginBottom="xl">
          {t("screens.home.description")}
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
