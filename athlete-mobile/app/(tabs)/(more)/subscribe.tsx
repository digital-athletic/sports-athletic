import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

export default function SubscribeScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Subscribe</Text>
      <Text variant="description">
        Subscription purchase flow - Legacy: views/more/pages/Subscribe
      </Text>
      <Box gap="m">
        <Link href="/subscription-status" asChild>
          <Button>View Subscription Status</Button>
        </Link>
        <Link href="../" asChild>
          <Button variant="secondary">Back</Button>
        </Link>
      </Box>
    </Box>
  );
}
