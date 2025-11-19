import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";

/**
 * Anamnesis Stack Layout
 *
 * User onboarding and profile setup flow including health questionnaire.
 * Legacy: AnamnesisStack (Stack Navigator)
 */
export default function AnamnesisLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.lightGrey1 },
      }}
    >
      {/* <Stack.Screen name="index" /> */}
      {/* <Stack.Screen name="sport" />
      <Stack.Screen name="userprofile" />
      <Stack.Screen name="anamnesis" />
      <Stack.Screen name="training-days" />
      <Stack.Screen name="season-phase" />
      <Stack.Screen name="generating" /> */}
    </Stack>
  );
}
