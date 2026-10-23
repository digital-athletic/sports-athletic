import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AdditionalTrainingWorkoutsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const title =
    typeof params.title === "string"
      ? params.title
      : t("screens.home.additionalTrainings.title");

  return (
    <>
      <Stack.Screen options={{ title, headerShown: true }} />
      <Box
        flex={1}
        backgroundColor="lightGrey1"
        justifyContent="center"
        alignItems="center"
        padding="l"
      >
        <Text
          variant="body"
          color="darkGrey1"
          textAlign="center"
          accessibilityRole="text"
        >
          {t("screens.home.additionalTrainings.noWorkouts")}
        </Text>
      </Box>
    </>
  );
}
