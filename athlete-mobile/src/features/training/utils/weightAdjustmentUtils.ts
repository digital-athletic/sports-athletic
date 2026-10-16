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
 * A target in kilograms rounds to a loadable weight first.
 */
export function getTargetWeight(
  intensity: IntensityData,
  exerciseData: ExerciseType,
  athlete: WeightAthlete,
): number | undefined {
  const target = convertTargetWeight(intensity, exerciseData, athlete);
  return typeof target === "number" &&
    getWeightType(exerciseData, intensity) === "weightAbsolute"
    ? roundWeightValue(target, exerciseData)
    : target;
}

const convertTargetWeight = (
  intensity: IntensityData,
  exerciseData: ExerciseType,
  athlete: WeightAthlete,
): number | undefined => {
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
};

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

const toLoad = (
  weight: number,
  { weightType, maxValue }: WeightStepOptions,
): number | undefined => {
  if (weightType !== "weightFMax") return weight;
  return maxValue ? (weight / 100) * maxValue : undefined;
};

const toWeight = (
  load: number,
  { weightType, maxValue }: WeightStepOptions,
): number =>
  weightType === "weightFMax" && maxValue ? (load / maxValue) * 100 : load;

// 0.5 kg divides every equipment rounding step.
const getNeighbourLoad = (
  load: number,
  sign: 1 | -1,
  exerciseData: ExerciseType,
): number | undefined => {
  for (let offset = 0.5; offset <= 10; offset += 0.5) {
    const candidate = roundWeightValue(load + sign * offset, exerciseData);
    if (candidate !== load && candidate >= 0) return candidate;
  }
  return undefined;
};

/**
 * One weight step multiplies the rounded current load by 1.025 or 0.975, clamps
 * the exact result to the bounds and rounds it. When rounding returns the
 * current load, the step takes the next available load inside the bound.
 */
export function calculateWeightStep(
  currentWeight: number,
  direction: "INCREASE" | "DECREASE",
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): number {
  const sign = direction === "INCREASE" ? 1 : -1;
  const factor = 1 + sign * 0.025;
  const currentLoad = toLoad(currentWeight, options);
  // A percentage without F-Max has no load to round.
  if (currentLoad === undefined) {
    return clampToBounds(currentWeight * factor, currentWeight, sign, options);
  }

  const loadBounds: WeightStepOptions = {
    ...options,
    targetWeight: toLoad(options.targetWeight ?? Infinity, options),
    lowestWeight: toLoad(options.lowestWeight ?? 0, options),
  };
  const clamp = (load: number, from: number) =>
    clampToBounds(load, from, sign, loadBounds);
  const round = (load: number) => roundWeightValue(load, exerciseData);
  const rounded = round(currentLoad);
  const load = round(clamp(rounded * factor, rounded));
  if ((load - rounded) * sign > 0) return toWeight(load, options);

  // The bound wins over the forced load: the athlete stays on the rounded load.
  const forced = getNeighbourLoad(rounded, sign, exerciseData);
  return toWeight(
    forced !== undefined && round(clamp(forced, rounded)) === forced
      ? forced
      : rounded,
    options,
  );
}

// A value already below the lowest weight must not jump up to it on a decrease.
const clampToBounds = (
  value: number,
  from: number,
  sign: 1 | -1,
  { targetWeight, lowestWeight }: WeightStepOptions,
): number =>
  sign > 0
    ? Math.min(value, targetWeight ?? Infinity)
    : Math.max(value, Math.min(lowestWeight ?? 0, from));

const isStepWithoutChange = (
  weight: number,
  direction: "INCREASE" | "DECREASE",
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): boolean => {
  const load = toLoad(weight, options);
  const nextLoad = toLoad(
    calculateWeightStep(weight, direction, exerciseData, options),
    options,
  );
  if (load === undefined || nextLoad === undefined) return false;
  return (
    roundWeightValue(nextLoad, exerciseData) ===
    roundWeightValue(load, exerciseData)
  );
};

/**
 * The target load counts as reached when the weight reaches it or when an
 * increase cannot change the load.
 */
export function isTargetLoadReached(
  weight: number,
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): boolean {
  const { targetWeight } = options;
  if (typeof targetWeight !== "number") return false;
  if (weight >= targetWeight) return true;
  return isStepWithoutChange(weight, "INCREASE", exerciseData, options);
}

/**
 * The lowest load counts as reached when the weight reaches it or when a
 * reduction cannot change the load, for example at the empty bar.
 */
export function isLowestLoadReached(
  weight: number,
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): boolean {
  const { lowestWeight } = options;
  if (typeof lowestWeight === "number" && weight <= lowestWeight) return true;
  return isStepWithoutChange(weight, "DECREASE", exerciseData, options);
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
