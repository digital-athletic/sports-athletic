import { SkipHeader } from "@/common/SkipHeader";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { useTheme } from "@/theme/theme";
import { Route, router, Stack } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpeechBubble } from "../../src/common/SpeechBubble";
import { useUserProfileStore } from "../../src/store/userProfileStore";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { anamnesisCompleted } = useUserProfileStore();
  const insets = useSafeAreaInsets();

  const handleStartAnamnesis = useCallback(() => {
    router.push({
      pathname: "/(anamnesis)/anamnesis/sport",
      params: { originPath: "/(anamnesis)/anamnesis" satisfies Route },
    });
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.welcome.title"),
          headerRight: () => (
            <SkipHeader
              alertTitle="screens.welcome.abortQuestion"
              alertMessage={
                anamnesisCompleted
                  ? "screens.welcome.abortExplanation"
                  : "screens.welcome.abortIncomplete"
              }
            />
          ),
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
