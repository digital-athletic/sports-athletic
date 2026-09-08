import { getExerciseById } from "@/data/exerciseRegistry";
import { useTrainingStore } from "@/features/training/trainingStore";
import { isFeedbackEligibleSkill } from "@/features/training/utils/exerciseDataUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type ListRow = {
  index: number;
  exerciseId: string;
  displayName: string;
  setLabel?: string;
  isTest: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
  completed: boolean;
};

/** Builds the visible checklist rows (pause exercises excluded) for the list view. */
export function useTrainingListRows() {
  const { t } = useTranslation();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const activeTraining = useTrainingStore((s) => s.activeTraining);

  const rows = useMemo(() => {
    if (!exerciseList) return [];

    return exerciseList.reduce<ListRow[]>((acc, exercise, index) => {
      if (checkIsPauseExercise(exercise.exerciseId)) return acc;

      const exerciseData = getExerciseById(exercise.exerciseId);
      const setLabel =
        exercise.set && exercise.set[1] > 1
          ? t("training.active.set", {
              current: exercise.set[0],
              total: exercise.set[1],
            })
          : undefined;

      acc.push({
        index,
        exerciseId: exercise.exerciseId,
        displayName:
          exerciseData?.displayName ??
          exerciseData?.name ??
          exercise.exerciseId,
        setLabel,
        isTest: exercise.repetition === -1,
        isLastInSet: exercise.set?.[0] === exercise.set?.[1],
        isFeedbackSkill: isFeedbackEligibleSkill(
          activeTraining,
          exercise.skill,
        ),
        completed: Boolean(exercise.completed),
      });
      return acc;
    }, []);
  }, [exerciseList, activeTraining, t]);

  return { rows };
}
