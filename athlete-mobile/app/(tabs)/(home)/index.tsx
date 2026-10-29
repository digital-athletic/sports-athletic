import { featureFlags } from "@/config/featureFlags";
import { HomeTrainingShortcuts } from "@/features/home/HomeTrainingShortcuts";
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
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { ScrollBox } from "@/theme/ScrollBox";
import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box flex={1} flexDirection={isLandscape ? "row" : "column"}>
          <Box flex={isLandscape ? 2 : 1} padding="l">
            <Card variant="elevated" flex={1} minHeight={400}>
              <IndividualWorkoutDisplay
                goToTraining={goToTraining}
                goToAnamnesis={goToAnamnesis}
                goToSeasonPhase={goToSeasonPhase}
                goToSectionDetails={goToSectionDetails}
              />
            </Card>
          </Box>

          <HomeTrainingShortcuts isLandscape={isLandscape} />
        </Box>
      </ScrollBox>
    </>
  );
}
