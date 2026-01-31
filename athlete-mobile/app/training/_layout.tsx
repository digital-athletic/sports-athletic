import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";

/**
 * Training Stack Layout
 *
 * Active training session management flow.
 * Gestures disabled on key screens to prevent accidental navigation.
 * Protected by Stack.Protected in root layout.
 */
export default function TrainingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.lightGrey1 },
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
