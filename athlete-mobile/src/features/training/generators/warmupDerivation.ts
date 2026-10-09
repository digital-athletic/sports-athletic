import { roundWeightValue } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";

export const WARMUP_WEIGHT_PERCENTAGES = [50, 75] as const;

export const WARMUP_REST_SECONDS = 60 as const;

/** Warm-up loads from the displayed, rounded load of the 1st working set. */
export const computeWarmupWeights = (
  firstWorkingWeight: number,
  exercise: Pick<ExerciseType, "tags">,
): number[] =>
  WARMUP_WEIGHT_PERCENTAGES.map((percentage) =>
    roundWeightValue((percentage / 100) * firstWorkingWeight, exercise),
  );
