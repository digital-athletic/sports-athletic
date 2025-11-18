import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { type FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, Image, StyleSheet } from "react-native";
import { SpeechBubble } from "../common/SpeechBubble";
import { ViewWithTitle } from "../common/ViewWithTitle";
import { useUserProfileStore } from "../store/userProfileStore";

/**
 * Welcome Screen
 *
 * Initial screen in the anamnesis flow that introduces the coach
 * and starts the user profile setup process.
 */
export const Welcome: FC = () => {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { isInInitialAnamnesis, anamnesisCompleted, setIsInInitialAnamnesis } =
    useUserProfileStore();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true // Prevent back navigation
    );

    return () => backHandler.remove();
  }, []);

  const handleClose = useCallback(() => {
    const message = anamnesisCompleted
      ? t("screens.welcome.abortExplanation")
      : t("screens.welcome.abortIncomplete");

    Alert.alert(t("screens.welcome.abortQuestion"), message, [
      {
        text: t("screens.welcome.yes"),
        onPress: () => {
          if (isInInitialAnamnesis) {
            setIsInInitialAnamnesis(false);
            router.replace("/(tabs)/profile/subscribe");
          } else {
            router.replace("/(tabs)");
          }
        },
      },
      {
        text: t("screens.welcome.no"),
      },
    ]);
  }, [anamnesisCompleted, isInInitialAnamnesis, setIsInInitialAnamnesis, t]);

  const handleStartAnamnesis = useCallback(() => {
    router.push("/anamnesis/sport");
  }, []);

  return (
    <ViewWithTitle
      title={t("screens.welcome.title")}
      fixed
      onClose={handleClose}
      backgroundColor="lightGrey1"
    >
      <Box flex={1} padding="l">
        <SpeechBubble text={t("screens.welcome.greeting")} centered />
        <Box flex={3} width="100%" justifyContent="center" alignItems="center">
          <Image
            source={require("../../assets/img/coach/welcome/trainer.png")}
            resizeMode="contain"
            style={styles.trainer}
            accessibilityLabel={t("screens.welcome.coachImageAlt")}
          />
        </Box>
      </Box>
      <Box
        position="absolute"
        bottom={spacing.l}
        left={spacing.l}
        right={spacing.l}
      >
        <Button onPress={handleStartAnamnesis}>
          {t("screens.welcome.letsGo")}
        </Button>
      </Box>
    </ViewWithTitle>
  );
};

const styles = StyleSheet.create({
  trainer: {
    width: "100%",
    height: "100%",
  },
});
