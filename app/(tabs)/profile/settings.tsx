import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, Switch } from "react-native";

/**
 * Settings Screen
 *
 * App settings and preferences.
 * Legacy: views/more/pages/Settings
 */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="white">
        <Text variant="title" marginTop="xxl" marginBottom="s">
          Settings
        </Text>
        <Text variant="description">Configure your app preferences</Text>

        <Card variant="flat" marginBottom="xl">
          <Text variant="cardTitle" marginBottom="m">
            General
          </Text>

          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingVertical="s"
            borderBottomWidth={1}
            borderBottomColor="lightGrey2"
          >
            <Text variant="body">Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.lightGrey2, true: colors.primary }}
            />
          </Box>

          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingVertical="s"
            borderBottomWidth={1}
            borderBottomColor="lightGrey2"
          >
            <Text variant="body">Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: colors.lightGrey2, true: colors.primary }}
            />
          </Box>
        </Card>

        <Link href="../" asChild>
          <Button variant="secondary">Back</Button>
        </Link>
      </Box>
    </ScrollView>
  );
}
