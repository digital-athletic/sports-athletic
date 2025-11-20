import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Select Training Screen
 *
 * Initial screen where users choose their training session.
 * Legacy: views/training/SelectTraining (initial route)
 */
export default function SelectTrainingScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Select Training</Text>
      <Text variant="description">Choose your training session</Text>

      <Box width="100%" gap="m">
        <Link href="/training/muscle-soreness" asChild>
          <Button>Start Training Session</Button>
        </Link>

        <Link href="../" asChild>
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </Box>
    </Box>
  );
}
