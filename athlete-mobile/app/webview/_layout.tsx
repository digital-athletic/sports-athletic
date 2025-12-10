import { Stack } from "expo-router";

/**
 * WebView Stack Layout
 *
 * Full-screen web content viewing.
 * Legacy: WebViewStack (Stack Navigator)
 */
export default function WebViewStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
