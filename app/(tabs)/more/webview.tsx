import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

export default function WebViewScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="white"
    >
      <Text variant="title">Web View</Text>
      <Text variant="description">
        In-app web browser - Legacy: views/webview/WebViewContainer (in
        MoreStack)
      </Text>
      <Link href="../" asChild>
        <Button variant="secondary">Back</Button>
      </Link>
    </Box>
  );
}
