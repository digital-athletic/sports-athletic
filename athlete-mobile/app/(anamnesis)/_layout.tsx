import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";

/**
 * Anamnesis Stack Layout
 *
 * User onboarding and profile setup flow including health questionnaire.
 * Protected by Stack.Protected in root layout.
 */
export default function AnamnesisLayout() {
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
