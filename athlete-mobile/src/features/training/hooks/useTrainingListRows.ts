import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import { isFeedbackEligibleSkill } from "@/features/training/utils/exerciseDataUtils";
import { deriveWeightForExercise } from "@/features/training/utils/workoutUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { getTagValues } from "@/utils/tagUtils";
import { type TFunction } from "i18next";
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
};

/** Target weight for the row, e.g. "20.00 kg" or "each 20.00 kg" for dumbbell exercises. */
function buildWeightPart(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
  t: TFunction,
): string | undefined {
  if (!exercise.weight || !exerciseData) return undefined;

  const derivedWeight = deriveWeightForExercise(
    exercise.weight,
    exercise.weightType,
    exerciseData,
    maxValues,
  );
  if (typeof derivedWeight !== "number") return undefined;

  const isDumbbellExercise = getTagValues(
    exerciseData.tags,
    TagGroups.EQUIPMENT,
  ).includes(WorkoutConstants.EQUIPMENT.DUMBBELL);
  const kilos = t("training.overview.kilos", {
    weight: derivedWeight.toFixed(2),
  });
  return isDumbbellExercise ? `${t("training.active.2x")}${kilos}` : kilos;
}

/** Combines set progress, target reps, and target weight into one subtitle line. */
function buildSetLabel(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
  t: TFunction,
): string | undefined {
  const isTest = exercise.repetition === -1;

  const setPart =
    exercise.set && exercise.set[1] > 1
      ? t("training.active.set", {
          current: exercise.set[0],
          total: exercise.set[1],
        })
      : undefined;

  const repsPart =
    !isTest &&
    typeof exercise.repetition === "number" &&
    exercise.repetition > 0
      ? t("training.overview.repetitions", { count: exercise.repetition })
      : undefined;

  const weightPart = buildWeightPart(exercise, exerciseData, maxValues, t);

  return (
    [setPart, repsPart, weightPart].filter(Boolean).join(" · ") || undefined
  );
}

/** Builds the visible checklist rows (pause exercises excluded) for the list view. */
export function useTrainingListRows() {
  const { t } = useTranslation();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const activeTraining = useTrainingStore((s) => s.activeTraining);
  const { workoutData } = useUserWorkoutStore();

  const rows = useMemo(() => {
    if (!exerciseList) return [];

    return exerciseList.reduce<ListRow[]>((acc, exercise, index) => {
      if (checkIsPauseExercise(exercise.exerciseId)) return acc;

      const exerciseData = getExerciseById(exercise.exerciseId);
      const isTest = exercise.repetition === -1;

      acc.push({
        index,
        exerciseId: exercise.exerciseId,
        displayName:
          exerciseData?.displayName ??
          exerciseData?.name ??
          exercise.exerciseId,
        setLabel: buildSetLabel(
          exercise,
          exerciseData,
          workoutData.maxValues,
          t,
        ),
        isTest,
        isLastInSet: exercise.set?.[0] === exercise.set?.[1],
        isFeedbackSkill: isFeedbackEligibleSkill(
          activeTraining,
          exercise.skill,
        ),
      });
      return acc;
    }, []);
  }, [exerciseList, activeTraining, workoutData.maxValues, t]);

  return { rows };
}
