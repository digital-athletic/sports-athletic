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
    />
  );
}
