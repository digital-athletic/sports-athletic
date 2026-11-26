import { SkipHeader } from "@/common/SkipHeader";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { RoutePath, router, Stack } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfileStore } from "../../src/store/userProfileStore";

type WelcomeSheetProps = {
  headline: string;
  text: string;
  startLabel: string;
  onStart: () => void;
};

/** White sheet over the hero with the greeting of the coach and the start. */
const WelcomeSheet: FC<WelcomeSheetProps> = ({
  headline,
  text,
  startLabel,
  onStart,
}) => {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Box
      backgroundColor="surface"
      padding="l"
      gap="m"
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, spacing.l) },
      ]}
    >
      <Text variant="display" accessibilityRole="header">
        {headline}
      </Text>
      <Text variant="subtitle" fontSize={17} lineHeight={25}>
        {text}
      </Text>
      <Button variant="cta" marginTop="s" onPress={onStart}>
        {startLabel}
      </Button>
    </Box>
  );
};

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { anamnesisCompleted } = useUserProfileStore();
  const insets = useSafeAreaInsets();

  const handleStartAnamnesis = () => {
    router.push({
      pathname: "/(anamnesis)/anamnesis/sport",
      params: { originPath: "/(anamnesis)/anamnesis" satisfies RoutePath },
    });
  };

  const [headline, ...greeting] = t("screens.welcome.greeting").split("\n");

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.welcome.title"),
          headerTitle: () => null,
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.transparent },
          headerRight: () => (
            <SkipHeader
              color="onPrimary"
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
      <Box flex={1} backgroundColor="onPrimaryContainer">
        <LinearGradient
          colors={[colors.primary, colors.onPrimaryContainer]}
          style={[styles.hero, { paddingTop: insets.top + HEADER_HEIGHT }]}
        >
          <Image
            source={require("../../assets/img/coach/welcome/trainer.png")}
            resizeMode="contain"
            style={styles.trainer}
            accessibilityLabel={t("screens.welcome.coachImageAlt")}
          />
        </LinearGradient>
        <WelcomeSheet
          headline={headline}
          text={greeting.join("\n")}
          startLabel={t("screens.welcome.letsGo")}
          onStart={handleStartAnamnesis}
        />
      </Box>
    </>
  );
}

const HEADER_HEIGHT = 56;

const styles = StyleSheet.create({
  hero: {
    flex: 1,
  },
  trainer: {
    width: "100%",
    height: "100%",
  },
  sheet: {
    marginTop: -28,
    paddingTop: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
