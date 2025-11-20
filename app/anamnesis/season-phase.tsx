import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Season Phase Screen
 *
 * User selects current season phase.
 * Legacy: views/data/SeasonPhase
 */
export default function SeasonPhaseScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Season Phase</Text>
      <Text variant="description">Select your current season phase</Text>

      <Link href="/anamnesis/generating" asChild>
        <Button>Generate Training Plan</Button>
      </Link>
    </Box>
  );
}
