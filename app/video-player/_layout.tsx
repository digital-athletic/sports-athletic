import { Stack } from "expo-router";

/**
 * Video Player Stack Layout
 *
 * Full-screen video playback.
 * Legacy: VideoPlayerViewStack (Stack Navigator)
 */
export default function VideoPlayerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
