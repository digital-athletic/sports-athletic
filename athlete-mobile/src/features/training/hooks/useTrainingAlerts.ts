import { Alert } from "@/common/Alert";
import { TagGroups } from "@/constants/tagGroups";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { useUserProfileStore } from "@/store/userProfileStore";
import { getTagValues } from "@/utils/tagUtils";
import { type TagsByGroup } from "../models/Tags";
import { type TrainingType } from "../models/Training";
import { type UserExerciseDataType } from "../models/UserExerciseData";
import { shouldShowPainAlert } from "../utils/painUtils";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Shows the pain alert before a qualifying training until the user confirms
 * it with OK. Saving the anamnesis with changed pains clears the seen flag.
 */
function usePainAlert() {
  const { t } = useTranslation();

  return (
    trainingType: TrainingType,
    exerciseList: Pick<UserExerciseDataType, "weightType">[],
    tags: TagsByGroup | undefined,
    onContinue: () => void,
  ) => {
    // Read at call time: the store changes between trainings without a rerender of the caller.
    const { warnings, setWarningSeen } = useUserProfileStore.getState();
    if (
      warnings.painAlertSeen ||
      !shouldShowPainAlert(trainingType, exerciseList, tags)
    ) {
      onContinue();
      return;
    }

    Alert.alert(
      t("training.active.strengthTestAlert.title"),
      t("training.active.strengthTestAlert.message"),
      [
        {
          text: t("common.ok"),
          onPress: () => {
            setWarningSeen("painAlertSeen", true);
            onContinue();
          },
        },
      ],
    );
  };
}

/**
 * Training alerts. The pain alert is shown before a training, see
 * usePainAlert. The barbell alert fires while advancing between exercises, at
 * most once per training; acknowledging it (OK) flips its showable flag off
 * for the rest of the training.
 */
export function useTrainingAlerts() {
  const { t } = useTranslation();
  const maybeShowPainAlert = usePainAlert();

  // A ref, not state: the flag is a write-only guard that never affects render output.
  const barbellAlertShowableRef = useRef(true);

  const maybeShowBarbellAlert = (
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
  };

  return {
    maybeShowPainAlert,
    maybeShowBarbellAlert,
  };
}
