import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function PrivacyScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Privacy Policy</Text>
      <Text variant="description">
        Privacy policy - Legacy: views/more/pages/Privacy
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
