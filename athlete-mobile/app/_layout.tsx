import { useAuthStateListener } from "@/auth/useAuthStateListener";
import { AlertHost } from "@/common/Alert";
import { useOTAService } from "@/services/OTAService";
import { useAuthStore } from "@/store/authStore";
import { theme } from "@/theme/theme";
import { ThemeProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";
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

  const { auth, _hasHydrated } = useAuthStore();

  // Wait for auth store to hydrate before rendering routes
  // to avoid flickering between auth states
  if (!_hasHydrated) {
    return (
      <ThemeProvider theme={theme}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <KeyboardProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={auth != null}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(anamnesis)" options={{ headerShown: false }} />
            <Stack.Screen name="training" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={auth == null}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Screen
            name="webview"
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
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
