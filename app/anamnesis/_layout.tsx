import { Stack } from "expo-router";

/**
 * Anamnesis Stack Layout
 *
 * User onboarding and profile setup flow including health questionnaire.
 * Legacy: AnamnesisStack (Stack Navigator)
 */
export default function AnamnesisLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
