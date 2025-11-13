import { Box, Button, Card, Text } from "@/components";
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="mainBackground">
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
            borderBottomColor="border"
          >
            <Text variant="body">Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#ccc", true: "#007AFF" }}
            />
          </Box>

          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingVertical="s"
            borderBottomWidth={1}
            borderBottomColor="border"
          >
            <Text variant="body">Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#ccc", true: "#007AFF" }}
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
