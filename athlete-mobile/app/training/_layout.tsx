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
      <Stack.Screen name="new" />
      <Stack.Screen name="training-overview" />
      {/* Phones stay in portrait: in landscape the video would push the timer,
          set and exercise name out of view. Android 16 ignores this lock on
          tablets, so there the video moves next to the content. */}
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
