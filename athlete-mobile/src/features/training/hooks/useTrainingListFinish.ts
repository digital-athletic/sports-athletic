import { Alert } from "@/common/Alert";
import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type UseTrainingListFinishParams = {
  allCompleted: boolean;
  endPause: () => void;
  completeRestRows: () => void;
};

/**
 * The list view's finish button: finishes when every set is done, otherwise
 * asks and then ends the training as aborted.
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
      Alert.alert(
        t("training.list.finishEarly.question"),
        t("training.list.finishEarly.explanation"),
        [
          {
            text: t("common.yes"),
            onPress: () => setIsFinishing(finishTraining(true)),
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
      finishTraining(false, useTrainingStore.getState().tempMaxValues),
    );
  };

  return { isFinishing, handleFinish };
}
