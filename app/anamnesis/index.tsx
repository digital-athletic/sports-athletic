import { SkipHeader } from "@/common/SkipHeader";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { useTheme } from "@/theme/theme";
import { Route, router, Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpeechBubble } from "../../src/common/SpeechBubble";
import { useUserProfileStore } from "../../src/store/userProfileStore";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { isInInitialAnamnesis, anamnesisCompleted, setIsInInitialAnamnesis } =
    useUserProfileStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true // Prevent back navigation
    );

    return () => backHandler.remove();
  }, []);

  const onSkip = useCallback(() => {
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
    router.push({
      pathname: "/anamnesis/sport",
      params: { originPath: "/anamnesis" satisfies Route },
    });
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.welcome.title"),
          headerRight: () => <SkipHeader onSkip={onSkip} />,
        }}
      />
      <Box flex={1} padding="l" style={{ paddingBottom: insets.bottom }}>
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
        style={{ paddingBottom: insets.bottom }}
      >
        <Button onPress={handleStartAnamnesis}>
          {t("screens.welcome.letsGo")}
        </Button>
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  trainer: {
    width: "100%",
    height: "100%",
  },
});
