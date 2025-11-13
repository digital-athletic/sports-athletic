import { Box, Button, Card, Text } from "@/components";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

/**
 * Profile Screen
 *
 * User profile information and editing.
 * Legacy: views/more/pages/Profile
 */
export default function ProfileScreen() {
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="mainBackground">
        <Text variant="title" marginTop="xxl" marginBottom="s">
          Profile
        </Text>
        <Text variant="description">Manage your personal information</Text>

        <Card variant="flat" marginBottom="xl">
          <Text variant="cardTitle" marginBottom="m">
            Personal Information
          </Text>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingVertical="s"
            borderBottomWidth={1}
            borderBottomColor="border"
          >
            <Text variant="body" color="textSecondary">
              Name
            </Text>
            <Text variant="body" fontWeight="600">
              User Name
            </Text>
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingVertical="s"
            borderBottomWidth={1}
            borderBottomColor="border"
          >
            <Text variant="body" color="textSecondary">
              Email
            </Text>
            <Text variant="body" fontWeight="600">
              user@example.com
            </Text>
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingVertical="s"
            borderBottomWidth={1}
            borderBottomColor="border"
          >
            <Text variant="body" color="textSecondary">
              Sport
            </Text>
            <Text variant="body" fontWeight="600">
              Not Set
            </Text>
          </Box>
        </Card>

        <Link href="../" asChild>
          <Button variant="secondary">Back</Button>
        </Link>
      </Box>
    </ScrollView>
  );
}
