import { Alert } from "@/common/Alert";
import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { useTrainingStore } from "@/features/training/trainingStore";
import { hasCompletedExerciseSet } from "@/features/training/utils/completedSets";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type UseTrainingListFinishParams = {
  allCompleted: boolean;
  endPause: () => void;
  completeRestRows: () => void;
};

/** An early finish keeps its done sets, except a strength test: its result needs every set. */
const savesEarlyFinish = () => {
  const { activeTraining, exerciseList } = useTrainingStore.getState();
  return (
    activeTraining?.type !== "TEST_WORKOUT" &&
    hasCompletedExerciseSet(exerciseList ?? [])
  );
};

/**
 * The list view's finish button: finishes when every set is done. With open
 * sets it asks first, then saves the done sets or, without any, aborts.
 */
export function useTrainingListFinish({
  allCompleted,
  endPause,
  completeRestRows,
}: UseTrainingListFinishParams) {
  const { t } = useTranslation();
  const { finishTraining } = useFinishTraining();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    if (!allCompleted) {
      const saves = savesEarlyFinish();
      Alert.alert(
        t("training.list.finishEarly.question"),
        saves
          ? t("training.list.finishEarly.savedExplanation")
          : t("training.list.finishEarly.discardedExplanation"),
        [
          {
            text: t("common.yes"),
            onPress: () => {
              if (saves) endPause();
              setIsFinishing(
                finishTraining(saves ? "finishedEarly" : "aborted"),
              );
            },
          },
          { text: t("common.no") },
        ],
      );
      return;
    }

    endPause();
    completeRestRows();
    // Visible feedback only: useFinishTraining guards against duplicate
    // invocations itself, this disables the button after the first tap.
    setIsFinishing(
      finishTraining("finished", useTrainingStore.getState().tempMaxValues),
    );
  };

  return { isFinishing, handleFinish };
}
