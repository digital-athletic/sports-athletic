import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  getExerciseTargetValue,
  getValueByGenderAndLevel,
} from "./workoutUtils";

export type WeightType = "weightFMax" | "weightAbsolute";

/** Percent of F-Max or kg, following the start value as the generator does. */
export function getWeightType(
  exerciseData: ExerciseType,
  intensity: IntensityData,
): WeightType {
  const type =
    exerciseData.values?.weight?.startValue?.type?.type ??
    intensity.startValue.weight?.type?.type;
  return type === "weightFMax" ? "weightFMax" : "weightAbsolute";
}

// The unit of the target the exercise authors, else the intensity fallback.
const getTargetWeightType = (
  intensity: IntensityData,
  exerciseData: ExerciseType,
  userLevel: TrainingLevelType,
  genderTag: GenderTag,
) => {
  const exerciseTarget = exerciseData.values?.weight?.targetValue;
  return getValueByGenderAndLevel(exerciseTarget, genderTag, userLevel) !==
    undefined
    ? exerciseTarget?.type?.type
    : intensity.targetValue.weight?.type?.type;
};

/**
 * Resolves the target weight in the unit of the exercise weight. A target in
 * the other unit, such as a % of F-Max intensity fallback for a kg exercise,
 * resolves to undefined.
 */
export function getTargetWeight(
  intensity: IntensityData,
  exerciseData: ExerciseType,
  userLevel: TrainingLevelType,
  genderTag: GenderTag,
): number | undefined {
  const target = getExerciseTargetValue(
    intensity,
    exerciseData,
    "weight",
    userLevel,
    genderTag,
  );
  if (typeof target !== "number") return undefined;

  const targetType = getTargetWeightType(
    intensity,
    exerciseData,
    userLevel,
    genderTag,
  );
  if (targetType !== "weightFMax" && targetType !== "weightAbsolute") {
    return target;
  }
  return targetType === getWeightType(exerciseData, intensity)
    ? target
    : undefined;
}

export interface WeightAdjustmentSource {
  intensity: IntensityData;
  /** An absolute weight increase stops at this weight. */
  targetWeight?: number;
}

const weightStep = (
  intensity: IntensityData,
  weightType: WeightType,
  adjustment: "SUCCEEDED" | "TOO_HARD",
) => intensity.adjustment[weightType]?.default?.default?.[adjustment];

/**
 * Calculates new weight value after adjustment.
 */
export function calculateNewWeight(
  currentWeight: number,
  adjustment: "SUCCEEDED" | "TOO_HARD",
  exerciseData: ExerciseType,
  { intensity, targetWeight }: WeightAdjustmentSource,
): number {
  const weightType = getWeightType(exerciseData, intensity);
  const step = weightStep(intensity, weightType, adjustment);
  if (typeof step !== "number") return currentWeight;

  const newWeight = currentWeight + step;
  const stopsAtTarget =
    weightType === "weightAbsolute" &&
    adjustment === "SUCCEEDED" &&
    typeof targetWeight === "number";
  return stopsAtTarget ? Math.min(newWeight, targetWeight) : newWeight;
}
