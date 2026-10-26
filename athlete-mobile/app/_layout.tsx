import { useAuthStateListener } from "@/auth/useAuthStateListener";
import { AlertHost } from "@/common/Alert";
import { OfflineBanner } from "@/common/OfflineBanner";
import { usePendingPlanCheck } from "@/features/training/hooks/usePendingPlanCheck";
import { useOTAService } from "@/services/OTAService";
import { useSyncManager } from "@/services/useSyncManager";
import { useAuthStore } from "@/store/authStore";
import {
  type ConsentStatus,
  useUserSettingsStore,
} from "@/store/userSettingsStore";
import { theme } from "@/theme/theme";
import { ThemeProvider } from "@shopify/restyle";
import { type Href, Stack } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";

function FullscreenSpinner() {
  return (
    <ThemeProvider theme={theme}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </ThemeProvider>
  );
}

// Guarded routes redirect here; the root stack has no anchor to fall back to.
function getAllowedEntry(
  signedIn: boolean,
  consentStatus: ConsentStatus,
): Href {
  if (!signedIn) {
    return "/onboarding";
  }
  return consentStatus === "missing" ? "/consent" : "/";
}

/**
 * Root Layout Component
 *
 * Entry point for the Expo Router navigation hierarchy.
 * Provides global context (theme, keyboard) and initializes auth listener.
 * Protected routes are guarded via Stack.Protected based on auth + consent status.
 */
export default function RootLayout() {
  useAuthStateListener();
  useOTAService();
  useSyncManager();
  usePendingPlanCheck();

  const [loaded, error] = useFonts(Ionicons.font);
  const { auth, _hasHydrated } = useAuthStore();
  const consentStatus = useUserSettingsStore((state) => state.consentStatus);

  if (!_hasHydrated || (!loaded && !error)) {
    return <FullscreenSpinner />;
  }

  // Show spinner while consent status is being fetched from Supabase
  if (auth != null && consentStatus === "loading") {
    return <FullscreenSpinner />;
  }

  const allowedEntry = getAllowedEntry(auth != null, consentStatus);

  return (
    <ThemeProvider theme={theme}>
      <KeyboardProvider>
        {/* Rotation follows the system; screens that do not hold up in
            landscape mark themselves portrait. */}
        <Stack screenOptions={{ headerShown: false, orientation: "default" }}>
          <Stack.Protected
            guard={auth != null && consentStatus === "accepted"}
            redirectTo={allowedEntry}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(anamnesis)" options={{ headerShown: false }} />
            <Stack.Screen name="training" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected
            guard={auth != null && consentStatus === "missing"}
            redirectTo={allowedEntry}
          >
            <Stack.Screen name="consent" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={auth == null} redirectTo={allowedEntry}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Screen
            name="webview"
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen name="test" options={{ headerShown: false }} />
        </Stack>
        <OfflineBanner />
        {Platform.OS === "web" && <AlertHost />}
      </KeyboardProvider>
    </ThemeProvider>
  );
}
