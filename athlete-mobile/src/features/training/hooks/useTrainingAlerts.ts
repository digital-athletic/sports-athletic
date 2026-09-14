import { TagGroups } from "@/constants/tagGroups";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * One-shot barbell alert shown while advancing between exercises. It fires at
 * most once per training; acknowledging it (OK) flips its showable flag off
 * for the rest of the training.
 */
export function useTrainingAlerts() {
  const { t } = useTranslation();

  // A ref, not state: the flag is a write-only guard that never affects render output.
  const barbellAlertShowableRef = useRef(true);

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
    maybeShowBarbellAlert,
  };
}
