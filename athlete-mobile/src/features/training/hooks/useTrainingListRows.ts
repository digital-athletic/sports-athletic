import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import { isFeedbackEligibleSkill } from "@/features/training/utils/exerciseDataUtils";
import { deriveEntryWeight } from "@/features/training/utils/workoutUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { getTagValues } from "@/utils/tagUtils";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";

/** Target load in kilos; isPerHand marks dumbbell exercises (one weight per hand). */
export type RowWeight = { kilos: number; isPerHand: boolean };

export type ListRow = {
  index: number;
  exerciseId: string;
  displayName: string;
  setLabel?: string;
  targetReps?: number;
  targetWeight?: RowWeight;
  isTest: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
  completed: boolean;
};

// Strength tests mark reps as -1, which this check also excludes.
function deriveRowReps(exercise: UserExerciseDataType): number | undefined {
  return typeof exercise.repetition === "number" && exercise.repetition > 0
    ? exercise.repetition
    : undefined;
}

function deriveRowWeight(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): RowWeight | undefined {
  if (!exercise.weight || !exerciseData) return undefined;

  const derivedWeight = deriveEntryWeight(
    {
      weight: exercise.weight,
      weightType: exercise.weightType,
      skill: exercise.skill,
    },
    exerciseData,
    maxValues,
  );
  if (typeof derivedWeight !== "number") return undefined;

  const isPerHand = getTagValues(
    exerciseData.tags,
    TagGroups.EQUIPMENT,
  ).includes(WorkoutConstants.EQUIPMENT.DUMBBELL);
  return { kilos: derivedWeight, isPerHand };
}

/** Subtitle such as "Set 1/3 · 10 repetitions · each 20.00 kg". */
function buildSetLabel(
  exercise: UserExerciseDataType,
  reps: number | undefined,
  weight: RowWeight | undefined,
  t: TFunction,
): string | undefined {
  const setPart =
    exercise.set && exercise.set[1] > 1
      ? t("training.active.set", {
          current: exercise.set[0],
          total: exercise.set[1],
        })
      : undefined;

  const repsPart =
    reps !== undefined
      ? t("training.overview.repetitions", { count: reps })
      : undefined;

  const weightPart = weight
    ? `${weight.isPerHand ? t("training.active.2x") : ""}${t(
        "training.overview.kilos",
        { weight: weight.kilos.toFixed(2) },
      )}`
    : undefined;

  return (
    [setPart, repsPart, weightPart].filter(Boolean).join(" · ") || undefined
  );
}

/** Builds the visible checklist rows (pause exercises excluded) for the list view. */
export function useTrainingListRows() {
  const { t } = useTranslation();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const activeTraining = useTrainingStore((s) => s.activeTraining);
  const maxValues = useUserWorkoutStore((s) => s.workoutData.maxValues);

  const rows = (exerciseList ?? []).reduce<ListRow[]>(
    (acc, exercise, index) => {
      if (checkIsPauseExercise(exercise.exerciseId)) return acc;

      const exerciseData = getExerciseById(exercise.exerciseId);
      const targetReps = deriveRowReps(exercise);
      const targetWeight = deriveRowWeight(exercise, exerciseData, maxValues);

      acc.push({
        index,
        exerciseId: exercise.exerciseId,
        displayName:
          exerciseData?.displayName ??
          exerciseData?.name ??
          exercise.exerciseId,
        setLabel: buildSetLabel(exercise, targetReps, targetWeight, t),
        targetReps,
        targetWeight,
        isTest: exercise.repetition === -1,
        isLastInSet: exercise.set?.[0] === exercise.set?.[1],
        isFeedbackSkill: isFeedbackEligibleSkill(
          activeTraining,
          exercise.skill,
        ),
        completed: Boolean(exercise.completed),
      });
      return acc;
    },
    [],
  );

  return { rows };
}
