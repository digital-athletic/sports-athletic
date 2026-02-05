import { IndividualWorkoutDisplay } from "@/features/training/IndividualWorkoutDisplay";
import { TestPeriodOverlay } from "@/features/training/TestPeriodOverlay";
import { useTrainingStore } from "@/features/training/trainingStore";
import { Logger } from "@/services/Logger";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { personalData, anamnesisCompleted, _hasHydrated } =
    useUserProfileStore();
  const { isSkipped } = useAnamnesisStore();
  const { setTrainingSelection } = useTrainingStore();

  const username = personalData?.username || "Mr. Anderson";

  useEffect(() => {
    Logger.logEvent("home_opened");
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Wait for store hydration before checking anamnesis status
      // to avoid redirecting based on default (non-persisted) values
      if (_hasHydrated && !anamnesisCompleted && !isSkipped) {
        router.replace("/anamnesis");
      }
    }, [_hasHydrated, anamnesisCompleted, isSkipped]),
  );

  const goToTraining = (type: "QUICK" | "PREV" | "PLAN") => {
    setTrainingSelection(type);
    router.push({
      pathname: "/training",
      params: { type },
    });
  };

  const goToAnamnesis = () => {
    router.replace("/anamnesis");
  };

  const goToSeasonPhase = () => {
    router.push("/(more)/anamnesis/season-phase");
  };

  const goToSubscribe = () => {
    router.push({
      pathname: "/subscribe",
      params: { backPath: "home" },
    });
  };

  const goToSectionDetails = (index: number) => {
    Logger.logEvent("section_details_opened");
    router.push({
      pathname: "/section-details",
      params: {
        type: "PLAN",
        sectionIndex: index,
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.home.greeting", { name: username }),
          headerShown: true,
        }}
      />
      <Box flex={1} backgroundColor="lightGrey1">
        <ImageBackground
          source={require("../../../assets/img/home/Background_2022_06_Alpha_30.png")}
          resizeMode="cover"
          style={styles.backgroundImage}
          accessibilityLabel={t("screens.home.imageAlt.background")}
        >
          <TestPeriodOverlay goToSubscribe={goToSubscribe} />
          <Box flex={1} />
          <Box flex={3} justifyContent="flex-start" paddingHorizontal="l">
            <IndividualWorkoutDisplay
              goToTraining={goToTraining}
              goToAnamnesis={goToAnamnesis}
              goToSeasonPhase={goToSeasonPhase}
              goToSectionDetails={goToSectionDetails}
            />
          </Box>
        </ImageBackground>

        <Box
          flexDirection="row"
          padding="l"
          gap="m"
          backgroundColor="lightGrey2"
          style={{
            paddingBottom: Platform.OS === "ios" ? insets.bottom : spacing.l,
          }}
        >
          <TouchableOpacity
            style={[styles.quickstartButton, { backgroundColor: colors.white }]}
            onPress={() => goToTraining("QUICK")}
            accessibilityRole="button"
            accessibilityLabel={t("screens.home.focusTraining.title")}
          >
            <Box alignItems="center" justifyContent="space-between" gap="s">
              <Image
                source={require("../../../assets/img/home/Icons/iconFocusTraining.png")}
                resizeMode="contain"
                style={styles.buttonIcon}
                accessibilityLabel={t(
                  "screens.home.imageAlt.focusTrainingIcon",
                )}
              />
              <Text variant="cardTitle" textAlign="center" fontSize={14}>
                {t("screens.home.focusTraining.title")}
              </Text>
              <Text
                variant="description"
                textAlign="center"
                fontSize={12}
                color="darkGrey1"
              >
                {t("screens.home.focusTraining.subtitle")}
              </Text>
            </Box>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickstartButton, { backgroundColor: colors.white }]}
            onPress={() => goToTraining("PREV")}
            accessibilityRole="button"
            accessibilityLabel={t("screens.home.preventionTraining.title")}
          >
            <Box alignItems="center" justifyContent="space-between" gap="s">
              <Image
                source={require("../../../assets/img/home/Icons/iconComplains.png")}
                resizeMode="contain"
                style={styles.buttonIcon}
                accessibilityLabel={t("screens.home.imageAlt.preventionIcon")}
              />
              <Text variant="cardTitle" textAlign="center" fontSize={14}>
                {t("screens.home.preventionTraining.title")}
              </Text>
              <Text
                variant="description"
                textAlign="center"
                fontSize={12}
                color="darkGrey1"
              >
                {t("screens.home.preventionTraining.subtitle")}
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 2,
    justifyContent: "center",
  },
  quickstartButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    width: 48,
    height: 48,
  },
});
