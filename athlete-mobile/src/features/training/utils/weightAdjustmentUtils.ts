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
  /** Rounded load the athlete last performed; a reduction compares with it. */
  performedLoad?: number;
}

export interface WeightStep {
  /** Underlying unrounded weight, the source of the next step. */
  weight: number;
  /** Rounded load in kg to prescribe; missing for a percentage without F-Max. */
  load?: number;
}

const toLoad = (
  weight: number,
  { weightType, maxValue }: WeightStepOptions,
): number | undefined => {
  if (weightType !== "weightFMax") return weight;
  return maxValue ? (weight / 100) * maxValue : undefined;
};

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
 * One weight step changes the underlying weight by x1.025 or x0.975 within the
 * load bounds. The prescribed load must differ from the reference load: the
 * rounded load of the current weight for an increase, the performed load for a
 * reduction. Otherwise it moves to the next available load, unless the bound
 * forbids it. The forced load never enters the underlying weight.
 */
export function calculateWeightStep(
  currentWeight: number,
  direction: "INCREASE" | "DECREASE",
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): WeightStep {
  const sign = direction === "INCREASE" ? 1 : -1;
  // A weight already below the lowest load must not jump up to it on a decrease.
  const clamp = (weight: number) =>
    sign > 0
      ? Math.min(weight, options.targetWeight ?? Infinity)
      : Math.max(weight, Math.min(options.lowestWeight ?? 0, currentWeight));
  const next = clamp(currentWeight * (1 + sign * 0.025));

  const currentLoad = toLoad(currentWeight, options);
  const nextLoad = toLoad(next, options);
  if (currentLoad === undefined || nextLoad === undefined)
    return { weight: next };

  const round = (load: number) => roundWeightValue(load, exerciseData);
  const reference =
    sign < 0 && options.performedLoad !== undefined
      ? options.performedLoad
      : round(currentLoad);
  const load = round(nextLoad);
  if ((load - reference) * sign > 0) return { weight: next, load };

  const toWeight = (forcedLoad: number) =>
    options.weightType === "weightFMax" && options.maxValue
      ? (forcedLoad / options.maxValue) * 100
      : forcedLoad;
  const bound = (forcedLoad: number) =>
    round(toLoad(clamp(toWeight(forcedLoad)), options) ?? forcedLoad);
  return {
    weight: next,
    load: forceLoad(reference, sign, exerciseData, bound) ?? load,
  };
}

// A forced load that the bound would cut is dropped: the athlete stays on the load.
const forceLoad = (
  reference: number,
  sign: 1 | -1,
  exerciseData: ExerciseType,
  bound: (load: number) => number,
): number | undefined => {
  const forced = getNeighbourLoad(reference, sign, exerciseData);
  return forced !== undefined && bound(forced) === forced ? forced : undefined;
};

/**
 * The load boundary counts as reached when the performed load reaches the
 * rounded target, or when an increase cannot change the load below the target.
 */
export function isTargetLoadReached(
  weight: number,
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): boolean {
  const { targetWeight } = options;
  if (typeof targetWeight !== "number") return false;
  if (weight >= targetWeight) return true;
  const load = toLoad(weight, options);
  const targetLoad = toLoad(targetWeight, options);
  if (load === undefined || targetLoad === undefined) return false;

  const roundedLoad = roundWeightValue(load, exerciseData);
  const performedLoad = options.performedLoad ?? roundedLoad;
  if (performedLoad >= roundWeightValue(targetLoad, exerciseData)) return true;
  return (
    calculateWeightStep(weight, "INCREASE", exerciseData, options).load ===
    roundedLoad
  );
}

/**
 * A stored performed load only counts while it is the rounded load of the
 * weight or its direct neighbour; a new strength test makes it stale.
 */
export function getValidPerformedLoad(
  performedLoad: number | undefined,
  weight: number,
  exerciseData: ExerciseType,
  options: WeightStepOptions,
): number | undefined {
  const load = toLoad(weight, options);
  if (performedLoad === undefined || load === undefined) return undefined;
  const rounded = roundWeightValue(load, exerciseData);
  return [
    rounded,
    getNeighbourLoad(rounded, 1, exerciseData),
    getNeighbourLoad(rounded, -1, exerciseData),
  ].includes(performedLoad)
    ? performedLoad
    : undefined;
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
