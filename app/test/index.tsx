import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function TestScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Test Menu</Text>
      <Text variant="description">
        Development and testing screens - Legacy: views/test/Test
      </Text>
      <Box gap="m">
        <Link href="/test/test-training" asChild>
          <Button>Test Training</Button>
        </Link>
        <Link href="../" asChild>
          <Button variant="secondary">Back</Button>
        </Link>
      </Box>
    </Box>
  );
}
