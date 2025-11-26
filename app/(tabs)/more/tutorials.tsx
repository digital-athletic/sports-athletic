import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

export default function TutorialsScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Tutorials</Text>
      <Text variant="description">
        Tutorial content - Legacy: views/more/pages/Tutorials
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
