import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function ExercisesScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="mainBackground"
    >
      <Text variant="title">Exercises</Text>
      <Text variant="description">
        Exercise library - Legacy: views/more/pages/Exercises
      </Text>
      <Box gap="m">
        <Link href="/profile/exercise-information" asChild>
          <Button>View Exercise Info</Button>
        </Link>
        <Link href="../" asChild>
          <Button variant="secondary">Back</Button>
        </Link>
      </Box>
    </Box>
  );
}
