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
      {/* In landscape the video fills the height and pushes the timer, set and
          exercise name out of view; a list based rework is planned (#40). */}
      <Stack.Screen
        name="training-active"
        options={{ orientation: "portrait" }}
      />
      <Stack.Screen name="training-success" />
      {/* Same video height problem as training-active. */}
      <Stack.Screen
        name="exercise-information"
        options={{ orientation: "portrait" }}
      />
      <Stack.Screen name="manual-strength-test" />
      <Stack.Screen name="muscle-soreness" />
      <Stack.Protected guard={featureFlags.trainingListViewEnabled}>
        <Stack.Screen name="training-list" />
      </Stack.Protected>
    </Stack>
  );
}
