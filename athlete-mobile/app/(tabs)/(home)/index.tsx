import { featureFlags } from "@/config/featureFlags";
import { IndividualWorkoutDisplay } from "@/features/training/IndividualWorkoutDisplay";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  getTrainingRouteForMode,
  hasStaleLeftovers,
  isResumableSession,
} from "@/features/training/utils/resumeUtils";
import { Logger } from "@/services/Logger";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { personalData, anamnesisCompleted, _hasHydrated } =
    useUserProfileStore();
  const { isSkipped } = useAnamnesisStore();
  const { setTrainingSelection } = useTrainingStore();
  const trainingHasHydrated = useTrainingStore((s) => s._hasHydrated);
  const activeTraining = useTrainingStore((s) => s.activeTraining);
  const time = useTrainingStore((s) => s.time);
  const trainingViewMode = useTrainingStore((s) => s.trainingViewMode);
  const clearTraining = useTrainingStore((s) => s.clearTraining);

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
        return;
      }

      if (!trainingHasHydrated) {
        return;
      }

      // A started and unfinished workout survives an OS kill in the persisted store
      // and is resumed directly; stale leftovers that were never started are discarded.
      // Runs after the anamnesis gate: a resumable workout implies completed anamnesis.
      if (isResumableSession(activeTraining, time)) {
        router.replace(
          getTrainingRouteForMode(
            trainingViewMode,
            featureFlags.trainingListViewEnabled,
          ),
        );
      } else if (hasStaleLeftovers(activeTraining, time)) {
        clearTraining();
      }
    }, [
      _hasHydrated,
      anamnesisCompleted,
      isSkipped,
      trainingHasHydrated,
      activeTraining,
      time,
      trainingViewMode,
      clearTraining,
    ]),
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
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box flex={1} padding="l">
          <Card variant="elevated" flex={1} minHeight={400}>
            <IndividualWorkoutDisplay
              goToTraining={goToTraining}
              goToAnamnesis={goToAnamnesis}
              goToSeasonPhase={goToSeasonPhase}
              goToSectionDetails={goToSectionDetails}
            />
          </Card>
        </Box>

        <Box
          flexDirection="row"
          paddingHorizontal="l"
          paddingTop="none"
          gap="m"
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
              <Ionicon
                name="scan-outline"
                size={48}
                color={colors.primary}
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
              <Ionicon
                name="calendar-outline"
                size={48}
                color={colors.primary}
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
      </ScrollBox>
    </>
  );
}

const styles = StyleSheet.create({
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
});
