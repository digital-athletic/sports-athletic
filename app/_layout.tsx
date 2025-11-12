import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";

/**
 * Root Layout Component
 *
 * This is the main entry point for the Expo Router navigation hierarchy.
 * It wraps all screens with a Stack navigator and provides the base layout.
 *
 * In the legacy app, this was the AppContainer with AllStack (Switch Navigator).
 * Expo Router uses conditional rendering and layout groups instead of Switch Navigator.
 */
export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="anamnesis" options={{ headerShown: false }} />
        <Stack.Screen name="training" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="webview"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="video-player"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="test" options={{ headerShown: false }} />
        <Stack.Screen
          name="contact"
          options={{
            headerShown: true,
            presentation: "modal",
            title: "Contact",
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
