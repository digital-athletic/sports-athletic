import { useAuthStateListener } from "@/auth/useAuthStateListener";
import { AlertHost } from "@/common/Alert";
import { loadExercises } from "@/data/loadExercises";
import { useLoadSkillTrees } from "@/features/training/hooks/useLoadSkillTree";
import { useOTAService } from "@/services/OTAService";
import { useAuthStore } from "@/store/authStore";
import {
  selectExercises,
  selectSetExercises,
  useExercisesStore,
} from "@/store/exercisesStore";
import { theme } from "@/theme/theme";
import { ThemeProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

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
  // Initialize and subscribe to Supabase auth state changes
  useAuthStateListener();

  const { auth } = useAuthStore();

  useOTAService();

  useLoadSkillTrees();

  const exercises = useExercisesStore(selectExercises);
  const setExercises = useExercisesStore(selectSetExercises);
  if (!exercises) {
    setExercises(loadExercises());
  }

  return (
    <ThemeProvider theme={theme}>
      <KeyboardProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={auth != null}>
            <Stack.Screen name="(anamnesis)" options={{ headerShown: false }} />
            <Stack.Screen name="training" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Screen name="onboarding" options={{ headerShown: false }} />

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
