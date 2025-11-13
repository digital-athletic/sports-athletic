import { Box, Text } from "@/components";
import { Link } from "expo-router";

/**
 * Video Player Screen (Full-Screen Modal)
 *
 * Full-screen video playback modal.
 * Legacy: VideoPlayerViewStack > VideoPlayerView
 */
export default function VideoPlayerScreen() {
  return (
    <Box flex={1} backgroundColor="black">
      <Box paddingTop="xxl" paddingHorizontal="l" paddingBottom="s">
        <Link href="../">
          <Box alignSelf="flex-end">
            <Text color="darkGrey3" fontSize={18} fontWeight="600">
              ✕ Close
            </Text>
          </Box>
        </Link>
      </Box>

      <Box flex={1} justifyContent="center" alignItems="center" padding="l">
        <Text variant="title" color="darkGrey3" marginBottom="s">
          Video Player
        </Text>
        <Text variant="description" color="lightGrey2" marginBottom="xl">
          Full-screen video playback interface. This would typically display a
          video player component.
        </Text>
        <Text fontSize={64}>🎥</Text>
      </Box>
    </Box>
  );
}
