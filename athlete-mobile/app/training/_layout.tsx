import { featureFlags } from "@/config/featureFlags";
import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";

/**
 * Training Stack Layout
 *
 * Active training session flow; gestures disabled on key screens.
 * Protected by Stack.Protected in the root layout; training-list is also
 * gated here on the checklist flag.
 */
export default function TrainingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.lightGrey1 },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="training-overview" />
      <Stack.Screen name="training-active" />
      <Stack.Screen name="training-success" />
      <Stack.Screen name="exercise-information" />
      <Stack.Screen name="manual-strength-test" />
      <Stack.Screen name="muscle-soreness" />
      <Stack.Protected guard={featureFlags.trainingListViewEnabled}>
        <Stack.Screen name="training-list" />
      </Stack.Protected>
    </Stack>
  );
}
