import type { AdjustmentParameterType } from "@/features/training/models/AdjustmentParameter";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { isTrainingLevel } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  AdjustmentConfig,
  DifficultyFeedbackType,
  ExerciseValuesData,
  FeedbackAdjustment,
} from "@/schemas/generator.schema";
import { readExerciseFMax } from "./exerciseFMax";
import { isWeightedExercise } from "./exerciseValues";
import {
  clampValueToStartAndTarget,
  type ExerciseValueContext,
} from "./startAndTargetValues";
import { readLowestPermittedWeight, stepWeight } from "./weightStep";

// Steps of an exercise without an intensity config.
const DEFAULT_ADJUSTMENT: AdjustmentConfig = {
  duration: { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -5 },
  height: { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -5 },
  repetition: { SUCCEEDED: 2, TOO_EASY: 4, TOO_HARD: -2 },
  weightFMax: { SUCCEEDED: 2.5, TOO_EASY: 5, TOO_HARD: -2.5 },
  weightAbsolute: { SUCCEEDED: 1, TOO_EASY: 2, TOO_HARD: -1 },
};

const ADJUSTMENT_PARAMETERS: AdjustmentParameterType[] = [
  "duration",
  "height",
  "repetition",
  "weightAbsolute",
  "weightFMax",
];

type AdjustmentByLevel =
  | Readonly<Partial<Record<string, FeedbackAdjustment>>>
  | undefined;

// Gender and level first, then the default of the level, then the default.
const readParameterAdjustment = (
  intensity: IntensityData,
  parameter: AdjustmentParameterType,
  gender: GenderTag,
  level: string,
): FeedbackAdjustment | undefined => {
  const byGender = intensity.adjustment[parameter];
  const forGender: AdjustmentByLevel = byGender?.[gender];
  const forDefault: AdjustmentByLevel = byGender?.default;
  return forGender?.[level] ?? forDefault?.[level] ?? forDefault?.default;
};

/**
 * Reads how far one feedback moves each value: the intensity config's steps
 * by gender and level, else fixed default steps.
 */
export const readFeedbackAdjustment = (
  intensity: IntensityData | null,
  gender: GenderTag,
  level: string,
): AdjustmentConfig =>
  intensity
    ? Object.fromEntries(
        ADJUSTMENT_PARAMETERS.map((parameter) => [
          parameter,
          readParameterAdjustment(intensity, parameter, gender, level),
        ]),
      )
    : DEFAULT_ADJUSTMENT;

const hasWeightValue = (
  exercise: ExerciseType,
  values: ExerciseValuesData,
): values is ExerciseValuesData & { weight: number } =>
  isWeightedExercise(exercise) && typeof values.weight === "number";

// One weight step down, not below the lowest permitted load.
const lowerWeightByOneStep = (
  values: ExerciseValuesData & { weight: number },
  { intensity, exercise, gender, level }: ExerciseValueContext,
  maxValues: MaxValuesType,
): number => {
  const weightType =
    values.weightType === "weightFMax" ? "weightFMax" : "weightAbsolute";
  return stepWeight(values.weight, "DECREASE", exercise, {
    weightType,
    lowestWeight: intensity
      ? readLowestPermittedWeight(intensity, weightType, exercise, {
          gender,
          level: isTrainingLevel(level) ? level : undefined,
        })
      : undefined,
    maxValue: readExerciseFMax(exercise, maxValues),
  });
};

// Repetitions and duration take one feedback step within start and target.
const stepRangeValues = (
  values: ExerciseValuesData,
  feedback: DifficultyFeedbackType,
  context: ExerciseValueContext,
): ExerciseValuesData => {
  const { exercise, intensity, gender, level } = context;
  const adjustment = readFeedbackAdjustment(intensity, gender, level);
  const advances = {
    duration: exercise.isAdvanceByDuration,
    repetition: exercise.isAdvanceByReps,
  };
  const result = { ...values };
  for (const valueName of ["duration", "repetition"] as const) {
    const value = result[valueName];
    const step = adjustment[valueName];
    if (advances[valueName] && value && step) {
      result[valueName] = clampValueToStartAndTarget(
        value + step[feedback],
        valueName,
        context,
      );
    }
  }
  return result;
};

/**
 * Applies one feedback to the exercise values. A weighted exercise changes
 * only its weight on TOO_HARD and only repetitions or duration otherwise.
 * Height stays fixed. Positive feedback at the target raises the weight when
 * the athlete completes the exercise, so only TOO_HARD changes the weight here.
 */
export const adjustExerciseValuesByFeedback = (
  values: ExerciseValuesData,
  context: ExerciseValueContext,
  feedback: DifficultyFeedbackType,
  maxValues: MaxValuesType,
): ExerciseValuesData =>
  feedback === "TOO_HARD" && hasWeightValue(context.exercise, values)
    ? { ...values, weight: lowerWeightByOneStep(values, context, maxValues) }
    : stepRangeValues(values, feedback, context);
