import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";

export default function EquipmentScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Equipment</Text>
      <Text variant="description">
        Equipment information - Legacy: views/more/pages/Equipment
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
