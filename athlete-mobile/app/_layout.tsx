import { useAuthStateListener } from "@/auth/useAuthStateListener";
import { AlertHost } from "@/common/Alert";
import { useOTAService } from "@/services/OTAService";
import { useAuthStore } from "@/store/authStore";
import { theme } from "@/theme/theme";
import { ThemeProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

/**
 * Root Layout Component
 *
 * Entry point for the Expo Router navigation hierarchy.
 * Provides global context (theme, keyboard) and initializes auth listener.
 * Protected routes are guarded via Stack.Protected.
 */
export default function RootLayout() {
  useAuthStateListener();
  useOTAService();

  const { auth } = useAuthStore();

  return (
    <ThemeProvider theme={theme}>
      <KeyboardProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={auth != null}>
            <Stack.Screen name="(anamnesis)" options={{ headerShown: false }} />
            <Stack.Screen name="training" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={auth == null}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Screen
            name="webview"
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
        {Platform.OS === "web" && <AlertHost />}
      </KeyboardProvider>
    </ThemeProvider>
  );
}
