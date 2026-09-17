import { Alert } from "@/common/Alert";
import { TagGroups } from "@/constants/tagGroups";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Training alerts. The pain alert is shown once before a training starts, the
 * caller decides whether it applies. The barbell alert fires while advancing
 * between exercises, at most once per training; acknowledging it (OK) flips
 * its showable flag off for the rest of the training.
 */
export function useTrainingAlerts() {
  const { t } = useTranslation();

  // A ref, not state: the flag is a write-only guard that never affects render output.
  const barbellAlertShowableRef = useRef(true);

  const showPainAlert = useCallback(
    (onAcknowledge: () => void) => {
      Alert.alert(
        t("training.active.strengthTestAlert.title"),
        t("training.active.strengthTestAlert.message"),
        [{ text: t("common.ok"), onPress: onAcknowledge }],
      );
    },
    [t],
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
    showPainAlert,
    maybeShowBarbellAlert,
  };
}
