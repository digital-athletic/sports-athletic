import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { Link } from "expo-router";

/**
 * WebView Screen (Full-Screen Modal)
 *
 * Full-screen web content viewing modal.
 * Legacy: WebViewStack > WebView
 */
export default function WebViewScreen() {
  return (
    <Box flex={1} backgroundColor="white">
      <Box
        paddingTop="xxl"
        paddingHorizontal="l"
        paddingBottom="s"
        borderBottomWidth={1}
        borderBottomColor="lightGrey2"
      >
        <Link href="../">
          <Box alignSelf="flex-end">
            <Text variant="link" fontSize={18}>
              ✕ Close
            </Text>
          </Box>
        </Link>
      </Box>

      <Box flex={1} justifyContent="center" alignItems="center" padding="l">
        <Text variant="title">Web View (Full Screen)</Text>
        <Text variant="description">
          Full-screen web content viewing modal. This would typically display a
          WebView component.
        </Text>
      </Box>
    </Box>
  );
}
