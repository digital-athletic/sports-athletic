import { MaxValuesType } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * Finalizes a training session (sequential or list-view) and navigates to
 * the success screen. Shared so both screens commit progress identically.
 */
export function useFinishTraining() {
  const router = useRouter();
  const { t } = useTranslation();
  const { activeTraining, setTrainingEndTime, setTempMaxValues } =
    useTrainingStore();
  const { addTestResult } = useExerciseProgressStore();
  const { saveMaxValues } = useUserWorkoutStore();

  // strengthTestMaxValues is passed directly for strength tests to avoid React state batching issues.
  // For non-test workouts (PREV, FOCUS, PLAN), strengthTestMaxValues is undefined and the
  // TEST_WORKOUT check below ensures no max values are saved.
  const finishTraining = useCallback(
    (
      aborted: boolean = false,
      strengthTestMaxValues?: MaxValuesType | null,
    ) => {
      try {
        // Record end time
        setTrainingEndTime(Date.now());

        // Log completion/abortion
        if (aborted) {
          logTrainingEvent(activeTraining, "training_aborted");
        } else {
          logTrainingEvent(activeTraining, "training_finished");
        }

        // Save test results if this is a test workout and not aborted
        if (
          activeTraining?.type === "TEST_WORKOUT" &&
          !aborted &&
          strengthTestMaxValues
        ) {
          Logger.logEvent("saving_max_values", {
            maxValues: strengthTestMaxValues,
          });
          saveMaxValues(strengthTestMaxValues);
          addTestResult(strengthTestMaxValues);
        }

        // Clear temporary test results (committed or discarded)
        setTempMaxValues(null);

        // Navigate to success screen
        router.push({
          pathname: "/training/training-success",
          params: { aborted: aborted.toString() },
        });
      } catch (error) {
        Logger.logError(error as Error);
        Alert.alert(t("common.error"), t("common.error"));
      }
    },
    [
      activeTraining,
      addTestResult,
      saveMaxValues,
      router,
      setTempMaxValues,
      setTrainingEndTime,
      t,
    ],
  );

  return { finishTraining };
}
