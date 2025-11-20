import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * Sport Selection Screen
 *
 * User selects their primary sport.
 * Legacy: views/data/Sport
 */
export default function SportScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Select Your Sport</Text>
      <Text variant="description">Choose your primary sport activity</Text>

      <Link href="/anamnesis/userprofile" asChild>
        <Button>Continue to Profile</Button>
      </Link>
    </Box>
  );
}
