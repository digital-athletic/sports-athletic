import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";

/**
 * Training Stack Layout
 *
 * Active training session management flow.
 * Gestures disabled on key screens to prevent accidental navigation.
 * Legacy: TrainingStack (Stack Navigator)
 */
export default function TrainingLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.lightGrey1 },
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
