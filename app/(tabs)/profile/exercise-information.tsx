import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function ExerciseInformationScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Exercise Information</Text>
      <Text variant="description">
        Exercise details from More menu - Legacy: ExerciseInformationMore
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
