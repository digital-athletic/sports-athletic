import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function NotificationsScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Notifications</Text>
      <Text variant="description">
        Notification settings - Legacy: views/more/pages/Notifications
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
