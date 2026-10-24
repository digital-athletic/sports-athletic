import { WorkoutConstants } from "@/constants/workoutConstants";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import {
  isTrainingLevel,
  type TrainingLevelType,
  type TrainingParameterType,
} from "@/schemas/common.schema";
import type { ExerciseType, ValueType } from "@/schemas/exercise.schema";
import type { StartValuesResult } from "@/schemas/generator.schema";

/** Gender and fitness level of the athlete, as value lookups key them. */
export interface ValueAthlete {
  gender: GenderTag;
  level: TrainingLevelType;
}

/**
 * What the value lookups of one exercise read. The level is the athlete's
 * fitness level in lower case; a level that is no training level reads only
 * defaults and skips the clamping.
 */
export interface ExerciseValueContext {
  intensity: IntensityData | null;
  exercise: ExerciseType;
  gender: GenderTag;
  level: string;
}

type ValueBound = "startValue" | "targetValue";
type LevelValues = Readonly<Record<string, unknown>>;

// The catalog stores "" for values an author left empty.
const isSetValue = (value: unknown): value is number | string =>
  value !== undefined && value !== null && value !== "";

const readSetLevelValue = (
  entry: unknown,
  level: string,
  fallback: number | undefined,
): number | undefined => {
  if (!entry || typeof entry !== "object") return fallback;
  const byDefault = (entry as LevelValues).default;
  const byLevel = (entry as LevelValues)[level];
  if (isSetValue(byLevel)) return +byLevel;
  return isSetValue(byDefault) ? +byDefault : fallback;
};

/**
 * Reads a value by gender and level, falling back through gender and level,
 * gender default, default and level, default and default. Empty entries count
 * as not set; 0 counts as set.
 *
 * readGenderLevelValue({ default: { default: 1 }, m: { advanced: 4 } }, "m", "advanced")
 * → 4
 */
export const readGenderLevelValue = (
  data: LevelValues | undefined,
  gender: string,
  level: string,
): number | undefined =>
  data
    ? readSetLevelValue(
        data[gender],
        level,
        readSetLevelValue(data.default, level, undefined),
      )
    : undefined;

const readTruthyLevelValue = (
  entry: Readonly<Partial<Record<string, string | number>>> | undefined,
  level: string,
  fallback: number | undefined,
): number | undefined => {
  if (!entry) return fallback;
  if (entry[level]) return Number(entry[level]);
  return entry.default ? Number(entry.default) : fallback;
};

/**
 * Reads an authored start or target entry of an exercise: the default entry,
 * then the gender entry, each by level before its default. Empty values and 0
 * count as not set, so the fallback stays.
 */
export const readAuthoredExerciseValue = (
  authored: ValueType | undefined,
  { gender, level }: ValueAthlete,
  fallback?: number,
): number | undefined => {
  if (!authored) return fallback;
  return readTruthyLevelValue(
    authored[gender],
    level,
    readTruthyLevelValue(authored.default, level, fallback),
  );
};

/** Start value of every value type the exercise authors for the athlete. */
export const readAuthoredStartValues = (
  values: ExerciseType["values"],
  gender: string,
  level: string,
): StartValuesResult => {
  const result: StartValuesResult = {};
  for (const valueName of WorkoutConstants.VALUE_TYPE_NAMES) {
    const value = readGenderLevelValue(
      values?.[valueName]?.startValue,
      gender,
      level,
    );
    if (value !== undefined) result[valueName] = value;
  }
  return result;
};

const readIntensityBoundValue = (
  bound: ValueBound,
  intensity: IntensityData,
  valueName: TrainingParameterType,
  { gender, level }: ValueAthlete,
): number | undefined => {
  const values = intensity[bound][valueName];
  if (!values?.default) return undefined;
  const byDefault = values.default[level] ?? values.default.default;
  const byGender = values[gender];
  if (!byGender) return byDefault;
  return byGender[level] || byGender.default;
};

// Skill ranges of an overriding intensity win over the exercise's own values.
const overridesExerciseValue = (
  intensity: IntensityData,
  valueName: TrainingParameterType,
) =>
  !!intensity.overridesExerciseRepsAndDuration &&
  (valueName === "repetition" || valueName === "duration");

const readBoundValue = (
  bound: ValueBound,
  {
    intensity,
    exercise,
  }: Pick<ExerciseValueContext, "exercise"> & {
    intensity: IntensityData;
  },
  valueName: TrainingParameterType,
  athlete: ValueAthlete,
): number | undefined => {
  const skillValue = readIntensityBoundValue(
    bound,
    intensity,
    valueName,
    athlete,
  );
  const value = overridesExerciseValue(intensity, valueName)
    ? skillValue
    : readAuthoredExerciseValue(
        exercise.values?.[valueName]?.[bound],
        athlete,
        skillValue,
      );
  return typeof value === "number" && !isNaN(value) ? value : undefined;
};

/** The most specific start value of the exercise for the athlete. */
export const readExerciseStartValue = (
  intensity: IntensityData,
  exercise: ExerciseType,
  valueName: TrainingParameterType,
  athlete: ValueAthlete,
): number | undefined =>
  readBoundValue("startValue", { intensity, exercise }, valueName, athlete);

/** The most specific target value of the exercise for the athlete. */
export const readExerciseTargetValue = (
  intensity: IntensityData,
  exercise: ExerciseType,
  valueName: TrainingParameterType,
  athlete: ValueAthlete,
): number | undefined =>
  readBoundValue("targetValue", { intensity, exercise }, valueName, athlete);

/** Keeps repetitions or duration within the resolved start and target. */
export const clampValueToStartAndTarget = (
  value: number,
  valueName: "duration" | "repetition",
  { intensity, exercise, gender, level }: ExerciseValueContext,
): number => {
  if (!intensity || !isTrainingLevel(level)) return value;
  const athlete = { gender, level };
  const start = readExerciseStartValue(intensity, exercise, valueName, athlete);
  const target = readExerciseTargetValue(
    intensity,
    exercise,
    valueName,
    athlete,
  );
  let clamped = value;
  if (typeof target === "number") clamped = Math.min(clamped, target);
  if (typeof start === "number") clamped = Math.max(clamped, start);
  return clamped;
};
