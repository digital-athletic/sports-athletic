import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

export default function TestTrainingScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Test Training</Text>
      <Text variant="description">
        Training testing screens - Legacy: views/test/TestTraining
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
