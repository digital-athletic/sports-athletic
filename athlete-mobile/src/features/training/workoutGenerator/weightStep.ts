import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { WeightType } from "@/schemas/generator.schema";
import {
  readAuthoredExerciseValue,
  readExerciseStartValue,
  type ValueAthlete,
} from "./startAndTargetValues";
import { roundWeight } from "./weightRounding";

export interface WeightStepOptions {
  weightType: WeightType;
  targetWeight?: number;
  lowestWeight?: number;
  /** F-Max of the exercise in kg, to round a percentage weight to a load. */
  maxValue?: number;
}

type StepSign = 1 | -1;

const convertWeightToLoad = (
  weight: number,
  { weightType, maxValue }: WeightStepOptions,
): number | undefined => {
  if (weightType !== "weightFMax") return weight;
  return maxValue ? (weight / 100) * maxValue : undefined;
};

const convertLoadToWeight = (
  load: number,
  { weightType, maxValue }: WeightStepOptions,
): number =>
  weightType === "weightFMax" && maxValue ? (load / maxValue) * 100 : load;

// A value already below the lowest weight must not jump up to it on a decrease.
const clampToBounds = (
  value: number,
  from: number,
  sign: StepSign,
  { targetWeight, lowestWeight }: WeightStepOptions,
): number =>
  sign > 0
    ? Math.min(value, targetWeight ?? Infinity)
    : Math.max(value, Math.min(lowestWeight ?? 0, from));

// 0.5 kg divides every equipment rounding step.
const readNeighbourLoad = (
  load: number,
  sign: StepSign,
  exercise: ExerciseType,
): number | undefined => {
  for (let offset = 0.5; offset <= 10; offset += 0.5) {
    const candidate = roundWeight(load + sign * offset, exercise);
    if (candidate !== load && candidate >= 0) return candidate;
  }
  return undefined;
};

/**
 * One weight step multiplies the rounded current load by 1.025 or 0.975, clamps
 * the exact result to the bounds and rounds it. When rounding returns the
 * current load, the step takes the next available load inside the bound.
 */
export const stepWeight = (
  currentWeight: number,
  direction: "INCREASE" | "DECREASE",
  exercise: ExerciseType,
  options: WeightStepOptions,
): number => {
  const sign: StepSign = direction === "INCREASE" ? 1 : -1;
  const factor = 1 + sign * 0.025;
  const currentLoad = convertWeightToLoad(currentWeight, options);
  // A percentage without F-Max has no load to round.
  if (currentLoad === undefined) {
    return clampToBounds(currentWeight * factor, currentWeight, sign, options);
  }

  const loadBounds: WeightStepOptions = {
    ...options,
    targetWeight: convertWeightToLoad(options.targetWeight ?? Infinity, options),
    lowestWeight: convertWeightToLoad(options.lowestWeight ?? 0, options),
  };
  const clamp = (load: number, from: number) =>
    clampToBounds(load, from, sign, loadBounds);
  const round = (load: number) => roundWeight(load, exercise);
  const rounded = round(currentLoad);
  const load = round(clamp(rounded * factor, rounded));
  if ((load - rounded) * sign > 0) return convertLoadToWeight(load, options);

  // The bound wins over the forced load: the athlete stays on the rounded load.
  const forced = readNeighbourLoad(rounded, sign, exercise);
  return convertLoadToWeight(
    forced !== undefined && round(clamp(forced, rounded)) === forced
      ? forced
      : rounded,
    options,
  );
};

// The unit of the start weight the exercise authors, else the intensity's.
const readStartWeightType = (
  intensity: IntensityData,
  exercise: ExerciseType,
  athlete: ValueAthlete,
) => {
  const authoredStart = exercise.values?.weight?.startValue;
  return readAuthoredExerciseValue(authoredStart, athlete) !== undefined
    ? authoredStart?.type?.type
    : intensity.startValue.weight?.type?.type;
};

/**
 * The lowest permitted load is authored in percent of F-Max. A start weight in
 * percent of F-Max below it lowers it to that start weight. Without a training
 * level the intensity's lowest load applies.
 */
export const readLowestPermittedWeight = (
  intensity: IntensityData,
  weightType: WeightType,
  exercise: ExerciseType,
  { gender, level }: { gender: GenderTag; level?: TrainingLevelType },
): number | undefined => {
  const areaLowest = intensity.lowestPermittedWeight;
  if (weightType !== "weightFMax" || typeof areaLowest !== "number") {
    return undefined;
  }
  if (!level) return areaLowest;
  const athlete = { gender, level };
  const start = readExerciseStartValue(intensity, exercise, "weight", athlete);
  return typeof start === "number" &&
    readStartWeightType(intensity, exercise, athlete) === "weightFMax"
    ? Math.min(areaLowest, start)
    : areaLowest;
};
