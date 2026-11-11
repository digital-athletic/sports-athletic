import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { isEnduranceSkill } from "@/features/training/utils/exerciseDataUtils";
import { deriveEntryWeight } from "@/features/training/utils/workoutUtils";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";

/** Target weight of a set in kg, or undefined for a set without weight. */
export function deriveSetWeight(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): number | undefined {
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
  return typeof derivedWeight === "number" ? derivedWeight : undefined;
}

// Strength tests mark reps as -1, which this check also excludes.
export function deriveRowReps(
  exercise: UserExerciseDataType,
): number | undefined {
  return typeof exercise.repetition === "number" && exercise.repetition > 0
    ? exercise.repetition
    : undefined;
}

/** Planned duration of a steady run in seconds; other sets have none. */
export function deriveSteadyRunDuration(
  exercise: UserExerciseDataType,
): number | undefined {
  return isEnduranceSkill(exercise.skill) &&
    typeof exercise.duration === "number" &&
    exercise.duration > 0
    ? exercise.duration
    : undefined;
}
