import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

/**
 * User Profile Screen
 *
 * User enters basic profile information.
 * Legacy: views/data/UserProfile
 */
export default function UserProfileScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Your Profile</Text>
      <Text variant="description">Enter your basic information</Text>

      <Link href="/anamnesis/anamnesis" asChild>
        <Button>Continue to Anamnesis</Button>
      </Link>
    </Box>
  );
}
