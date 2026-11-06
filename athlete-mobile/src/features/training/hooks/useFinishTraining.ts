import { Alert } from "@/common/Alert";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

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
  const hasFinishedRef = useRef(false);

  // strengthTestMaxValues is passed directly for strength tests to avoid React state batching issues.
  // For non-test workouts (PREV, FOCUS, PLAN), strengthTestMaxValues is undefined and the
  // TEST_WORKOUT check in testMaxValues ensures no max values are saved.
  const finishTraining = (
    aborted: boolean = false,
    strengthTestMaxValues?: MaxValuesType | null,
  ) => {
    // Guards against double-invocation (e.g. a fast double-tap on the
    // finish button), which would otherwise duplicate XP/workout entries
    // and, for TEST_WORKOUT, saved max values/test results.
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Computed before the try: the React Compiler skips a try block that
    // contains a conditional expression.
    const testMaxValues =
      activeTraining?.type === "TEST_WORKOUT" && !aborted
        ? strengthTestMaxValues
        : null;

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
      if (testMaxValues) {
        Logger.logEvent("saving_max_values", { maxValues: testMaxValues });
        saveMaxValues(testMaxValues);
        addTestResult(testMaxValues);
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
  };

  return { finishTraining };
}
