import { useActiveExerciseView } from "@/features/training/hooks/useActiveExerciseView";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { useExerciseTiming } from "@/features/training/hooks/useExerciseTiming";
import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { useTrainingAlerts } from "@/features/training/hooks/useTrainingAlerts";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import { mapSkillCodeToFocusArea } from "@/features/training/utils/skillTreeUtils";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type FeedbackCategory = "TOO_EASY" | "TOO_HARD" | "SUCCEEDED";

/**
 * Sequences the active training: exercise advancement, pause/skill-time
 * accounting, one-shot pain/barbell alerts, skip/feedback/abort, completion.
 */
export function useExerciseProgression() {
  const { t } = useTranslation();
  const {
    exerciseList,
    activeTraining,
    setActiveExerciseIndex,
    addPauseTime,
    addSkillTime,
    completedExerciseIndices,
    markExerciseCompleted,
  } = useTrainingStore();
  const {
    safeExerciseIndex,
    currentExercise,
    exerciseId,
    nextExercise,
    nextExerciseData,
    flags: { isPauseExercise, isNextExercisePause },
  } = useActiveExerciseView();
  const {
    saveExerciseAndBranchData,
    saveRepsInput,
    handleFeedback: completeFeedback,
    handleExerciseSkipped: markExerciseSkipped,
  } = useExerciseCompletion();
  const { finishTraining } = useFinishTraining();
  const {
    handlePauseToggled,
    getPauseElapsed,
    getExerciseElapsed,
    markPauseStart,
    resetExerciseStart,
  } = useExerciseTiming();
  const { maybeShowPainAlert, maybeShowBarbellAlert } = useTrainingAlerts();

  const [isAborted, setIsAborted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // strengthTestMaxValues only provided for strength test's last exercise
  const advanceToNextExercise = (
    strengthTestMaxValues?: MaxValuesType | null,
  ) => {
    if (!exerciseList) return;

    // Skip re-saving if this index was already completed via the checklist
    // (list-view) flow, to avoid double-applying weight/level progression.
    if (!completedExerciseIndices.includes(safeExerciseIndex)) {
      saveExerciseAndBranchData(safeExerciseIndex);
      markExerciseCompleted(safeExerciseIndex);
    }

    if (isPauseExercise) {
      // add time in pause to training stats
      const pauseDuration = getPauseElapsed();
      addPauseTime(pauseDuration);

      maybeShowPainAlert(nextExercise);
      maybeShowBarbellAlert(nextExerciseData, activeTraining?.type);
    } else if (currentExercise?.skill) {
      // Add exercise time to the skill statistics
      const exerciseDuration = getExerciseElapsed();
      const focusArea = mapSkillCodeToFocusArea(currentExercise.skill);
      if (focusArea) {
        addSkillTime(focusArea, exerciseDuration);
      }
    }

    if (safeExerciseIndex < exerciseList.length - 1) {
      setActiveExerciseIndex(safeExerciseIndex + 1);

      if (isNextExercisePause) {
        // set pause timer to new start
        markPauseStart();
      } else {
        resetExerciseStart();
      }
    } else {
      // Training complete
      finishTraining(false, strengthTestMaxValues);
    }
  };

  const handleAbortTraining = useCallback(() => {
    Alert.alert(
      t("training.active.abort.question"),
      t("training.active.abort.explanation"),
      [
        {
          text: t("common.yes"),
          onPress: () => {
            setIsAborted(true);
            finishTraining(true);
          },
        },
        {
          text: t("common.no"),
        },
      ],
    );
  }, [finishTraining, t]);

  const handleExerciseSkipped = () => {
    setIsSkipped(true);
    markExerciseSkipped(safeExerciseIndex);
    advanceToNextExercise();
  };

  useEffect(() => {
    setIsSkipped(false);
  }, [exerciseId]);

  const handleFeedback = (category: FeedbackCategory) => {
    completeFeedback(safeExerciseIndex, category);
  };

  const saveRepsForCurrentExercise = (reps: number) =>
    saveRepsInput(safeExerciseIndex, reps);

  return {
    isSkipped,
    isAborted,
    advanceToNextExercise,
    handleExerciseSkipped,
    handleFeedback,
    handleAbortTraining,
    handlePauseToggled,
    saveRepsForCurrentExercise,
  };
}
