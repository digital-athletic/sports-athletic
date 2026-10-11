import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  getExerciseStartValue,
  getExerciseTargetValue,
  getValueByGenderAndLevel,
  roundWeightValue,
} from "./workoutUtils";

export type WeightType = "weightFMax" | "weightAbsolute";

export interface WeightAthlete {
  userLevel: TrainingLevelType;
  genderTag: GenderTag;
  /** F-Max of the exercise in kg. */
  maxValue?: number;
}

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

// The unit of the value the exercise authors, else the intensity fallback.
const getAuthoredWeightType = (
  bound: "startValue" | "targetValue",
  intensity: IntensityData,
  exerciseData: ExerciseType,
  { userLevel, genderTag }: WeightAthlete,
) => {
  const authored = exerciseData.values?.weight?.[bound];
  return getValueByGenderAndLevel(authored, genderTag, userLevel) !== undefined
    ? authored?.type?.type
    : intensity[bound].weight?.type?.type;
};

/**
 * Resolves the target weight in the unit of the exercise weight. Authored
 * targets may use the other unit; they convert through the exercise F-Max.
 */
export function getTargetWeight(
  intensity: IntensityData,
  exerciseData: ExerciseType,
  athlete: WeightAthlete,
): number | undefined {
  const { userLevel, genderTag, maxValue } = athlete;
  const target = getExerciseTargetValue(
    intensity,
    exerciseData,
    "weight",
    userLevel,
    genderTag,
  );
  if (typeof target !== "number") return undefined;

  const targetType = getAuthoredWeightType(
    "targetValue",
    intensity,
    exerciseData,
    athlete,
  );
  const weightType = getWeightType(exerciseData, intensity);
  if (targetType !== "weightFMax" && targetType !== "weightAbsolute") {
    return target;
  }
  if (targetType === weightType) return target;
  if (!maxValue) return undefined;
  return weightType === "weightFMax"
    ? (target / maxValue) * 100
    : (target / 100) * maxValue;
}

/**
 * The lowest permitted load is authored in percent of F-Max. A start weight in
 * percent of F-Max below it lowers it to that start weight.
 */
export function getLowestPermittedWeight(
  intensity: IntensityData,
  weightType: WeightType,
  exerciseData: ExerciseType,
  {
    userLevel,
    genderTag,
  }: Partial<Pick<WeightAthlete, "userLevel">> &
    Pick<WeightAthlete, "genderTag">,
): number | undefined {
  const areaLowest = intensity.lowestPermittedWeight;
  if (weightType !== "weightFMax" || typeof areaLowest !== "number") {
    return undefined;
  }
  if (!userLevel) return areaLowest;
  const start = getExerciseStartValue(
    intensity,
    exerciseData,
    "weight",
    userLevel,
    genderTag,
  );
  const startsInPercent =
    getAuthoredWeightType("startValue", intensity, exerciseData, {
      userLevel,
      genderTag,
    }) === "weightFMax";
  return typeof start === "number" && startsInPercent
    ? Math.min(areaLowest, start)
    : areaLowest;
}

export interface WeightStepOptions {
  weightType: WeightType;
  targetWeight?: number;
  lowestWeight?: number;
  /** F-Max of the exercise in kg, to round a percentage weight to a load. */
  maxValue?: number;
}

/**
 * One weight step changes the underlying weight by x1.025 or x0.975 within the
 * load bounds. When rounding would hide the step, the underlying weight moves
 * to the next available load in that direction.
 */
export function calculateWeightStep(
  currentWeight: number,
  direction: "INCREASE" | "DECREASE",
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): number {
  const sign = direction === "INCREASE" ? 1 : -1;
  // A weight already below the lowest load must not jump up to it on a decrease.
  const clamp = (weight: number) =>
    sign > 0
      ? Math.min(weight, options.targetWeight ?? Infinity)
      : Math.max(weight, Math.min(options.lowestWeight ?? 0, currentWeight));
  const next = clamp(currentWeight * (1 + sign * 0.025));

  const { maxValue } = options;
  const isPercentage = options.weightType === "weightFMax";
  if (isPercentage && !maxValue) return next;
  const toLoad = (weight: number) =>
    isPercentage && maxValue ? (weight / 100) * maxValue : weight;
  const currentLoad = roundWeightValue(toLoad(currentWeight), exerciseData);
  if (roundWeightValue(toLoad(next), exerciseData) !== currentLoad) return next;

  // 0.5 kg divides every equipment rounding step.
  for (let offset = 0.5; offset <= 10; offset += 0.5) {
    const load = roundWeightValue(currentLoad + sign * offset, exerciseData);
    if (load !== currentLoad && load >= 0) {
      return clamp(isPercentage && maxValue ? (load / maxValue) * 100 : load);
    }
  }
  return next;
}

/**
 * Gets reset value for duration when weight changes.
 */
export function getResetDuration(
  exerciseData: ExerciseType,
  intensity: IntensityData,
  genderTag: GenderTag,
  userLevel: TrainingLevelType,
): number | undefined {
  if (!exerciseData.isAdvanceByDuration) return undefined;
  if (intensity.overridesExerciseRepsAndDuration) {
    return getExerciseStartValue(
      intensity,
      exerciseData,
      "duration",
      userLevel,
      genderTag,
    );
  }

  const exerciseStartValue = getValueByGenderAndLevel(
    exerciseData.values?.duration?.startValue,
    genderTag,
    userLevel,
  );

  return (
    exerciseStartValue ??
    intensity.startValue.duration?.[genderTag]?.[userLevel]
  );
}

/**
 * Gets reset value for repetition when weight changes.
 */
export function getResetRepetition(
  exerciseData: ExerciseType,
  intensity: IntensityData,
  genderTag: GenderTag,
  userLevel: TrainingLevelType,
): number | undefined {
  if (!exerciseData.isAdvanceByReps) return undefined;
  if (intensity.overridesExerciseRepsAndDuration) {
    return getExerciseStartValue(
      intensity,
      exerciseData,
      "repetition",
      userLevel,
      genderTag,
    );
  }

  const exerciseStartValue = getValueByGenderAndLevel(
    exerciseData.values?.repetition?.startValue,
    genderTag,
    userLevel,
  );

  return (
    exerciseStartValue ??
    intensity.startValue.repetition?.[genderTag]?.[userLevel]
  );
}
