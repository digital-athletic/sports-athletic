import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function ImprintScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Imprint</Text>
      <Text variant="description">
        Legal imprint - Legacy: views/more/pages/Imprint
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
