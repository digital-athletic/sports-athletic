import { TagGroups } from "@/constants/tagGroups";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { getTagValues, getUserTagValues } from "@/utils/tagUtils";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * One-shot pain/barbell alerts shown while advancing between exercises.
 * Each alert fires at most once per training; acknowledging it (OK) flips
 * its showable flag off for the rest of the training.
 */
export function useTrainingAlerts() {
  const { t } = useTranslation();
  const { workoutData } = useUserWorkoutStore();

  // Refs, not state: the flags are write-only guards that never affect render output.
  const painAlertShowableRef = useRef(true);
  const barbellAlertShowableRef = useRef(true);

  const maybeShowPainAlert = useCallback(
    (nextExercise: Pick<UserExerciseDataType, "weightType"> | undefined) => {
      if (
        !painAlertShowableRef.current ||
        nextExercise?.weightType !== "weightFMax"
      ) {
        return;
      }

      const userPains = getUserTagValues(workoutData.tags, TagGroups.PAIN);
      if (userPains.length > 0) {
        Alert.alert(
          t("training.active.strengthTestAlert.title"),
          t("training.active.strengthTestAlert.message"),
          [
            {
              text: t("common.ok"),
              onPress: () => {
                painAlertShowableRef.current = false;
              },
            },
          ],
        );
      }
    },
    [t, workoutData.tags],
  );

  const maybeShowBarbellAlert = useCallback(
    (
      nextExerciseData: Pick<ExerciseType, "tags"> | undefined,
      trainingType?: string,
    ) => {
      if (
        !barbellAlertShowableRef.current ||
        trainingType !== "TEST_WORKOUT" ||
        !getTagValues(nextExerciseData?.tags ?? [], TagGroups.EQUIPMENT).some(
          (item) => item.includes("BARBELL"),
        )
      ) {
        return;
      }

      Alert.alert(
        t("training.active.weightCalculationAlert.title"),
        t("training.active.weightCalculationAlert.message"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              barbellAlertShowableRef.current = false;
            },
          },
        ],
      );
    },
    [t],
  );

  return {
    maybeShowPainAlert,
    maybeShowBarbellAlert,
  };
}
