import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { IntensityData } from "@/features/training/models/Intensity";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { TrainingParameterType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  ExerciseValuesData,
  StartValuesResult,
  WeightType,
} from "@/schemas/generator.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { getTagValues } from "@/utils/tagUtils";
import { isSkillWithoutProgression } from "./skillCatalogEntry";
import {
  clampValueToStartAndTarget,
  type ExerciseValueContext,
  readAuthoredStartValues,
} from "./startAndTargetValues";

const SPEED_WARM_UP_SKILL = "WUSKSA";
const SPEED_WARM_UP_MAX_DURATION = 30;
const RANGE_VALUE_NAMES = ["repetition", "duration"] as const;

type RangeValueName = (typeof RANGE_VALUE_NAMES)[number];

/** An exercise with the weights equipment type takes a load. */
export const isWeightedExercise = (exercise: Pick<ExerciseType, "tags">) =>
  getTagValues(exercise.tags, TagGroups.EQ_TYPE).includes("WEIGHTS");

const hasJumpBox = (exercise: ExerciseType) => {
  const { BOX_LOW, BOX_HIGH } = WorkoutConstants.EQUIPMENT;
  return getTagValues(exercise.tags, TagGroups.EQUIPMENT).some(
    (equipment) => equipment === BOX_LOW || equipment === BOX_HIGH,
  );
};

const isAdvancedBy = (exercise: ExerciseType, valueName: RangeValueName) =>
  valueName === "duration"
    ? exercise.isAdvanceByDuration
    : exercise.isAdvanceByReps;

/**
 * Percent of F-Max when the exercise's start weight says so, or when the
 * exercise names no weight type and the intensity's start weight does.
 */
// Stored JSON may hold a weight entry without a start entry.
const readExerciseWeightType = (exercise: ExerciseType) =>
  exercise.values?.weight?.startValue?.type?.type;

const readWeightType = ({
  intensity,
  exercise,
}: ExerciseValueContext): WeightType => {
  const exerciseWeightType = readExerciseWeightType(exercise);
  const intensityWeightType = intensity?.startValue.weight?.type?.type;
  return exerciseWeightType === "weightFMax" ||
    (!exerciseWeightType && intensityWeightType === "weightFMax")
    ? "weightFMax"
    : "weightAbsolute";
};

type LevelValues = Readonly<Partial<Record<string, number>>> | undefined;

// Gender and level first, then the gender default, then the level default.
const readIntensityStartValue = (
  intensity: IntensityData,
  valueName: TrainingParameterType,
  { gender, level }: ExerciseValueContext,
): number | undefined => {
  const values = intensity.startValue[valueName];
  const byGender: LevelValues = values?.[gender];
  const byDefault: LevelValues = values?.default;
  const value = [
    byGender?.[level],
    byGender?.default,
    byDefault?.[level],
    byDefault?.default,
  ].find((candidate) => !!candidate);
  return value ? +value : undefined;
};

const readIntensityDefaults = (
  intensity: IntensityData,
  context: ExerciseValueContext,
): ExerciseValuesData => {
  const { exercise } = context;
  const data: ExerciseValuesData = { weightType: "weightAbsolute" };
  for (const valueName of RANGE_VALUE_NAMES) {
    if (isAdvancedBy(exercise, valueName)) {
      data[valueName] = readIntensityStartValue(intensity, valueName, context);
    }
  }
  if (isWeightedExercise(exercise)) {
    data.weight = readIntensityStartValue(intensity, "weight", context);
    if (intensity.startValue.weight?.type?.type === "weightFMax") {
      data.weightType = "weightFMax";
    }
  }
  if (exercise.isJump && hasJumpBox(exercise)) {
    data.height = readIntensityStartValue(intensity, "height", context);
  }
  return data;
};

// An intensity that overrides the exercise ranges keeps its own start values.
const applyAuthoredRange = (
  { intensity, exercise }: ExerciseValueContext,
  data: ExerciseValuesData,
  start: StartValuesResult,
): ExerciseValuesData => {
  if (intensity?.overridesExerciseRepsAndDuration) return data;
  const result = { ...data };
  for (const valueName of RANGE_VALUE_NAMES) {
    const value = start[valueName];
    if (isAdvancedBy(exercise, valueName) && value) result[valueName] = value;
  }
  return result;
};

const applyAuthoredStartValues = (
  context: ExerciseValueContext,
  data: ExerciseValuesData,
): ExerciseValuesData => {
  const { exercise, gender, level } = context;
  if (!exercise.values) return data;
  const start = readAuthoredStartValues(exercise.values, gender, level);
  const result = applyAuthoredRange(context, data, start);
  if (isWeightedExercise(exercise) && start.weight) {
    result.weightType = readWeightType(context);
    result.weight = start.weight;
  }
  if (exercise.isJump && start.height && hasJumpBox(exercise)) {
    result.height = start.height;
  }
  return result;
};

const applyStoredValues = (
  context: ExerciseValueContext,
  data: ExerciseValuesData,
  stored: UserExerciseDataType,
): ExerciseValuesData => {
  const { exercise } = context;
  const result = { ...data, weightType: readWeightType(context) };
  for (const valueName of RANGE_VALUE_NAMES) {
    const value = stored[valueName];
    if (isAdvancedBy(exercise, valueName) && value) result[valueName] = value;
  }
  if (exercise.isJump && stored.height) result.height = stored.height;
  // 0 kg is a valid stored load of a weighted exercise.
  if (stored.weight || (stored.weight === 0 && isWeightedExercise(exercise))) {
    result.weight = stored.weight;
  }
  return result;
};

// Stored values may predate the current start and target.
const isClampedSkill = (
  skillCatalog: SkillCatalog,
  skill: string | undefined,
) =>
  skill === undefined ||
  (skill !== "MAX" &&
    skill !== "MAX_STRENGTH" &&
    !isSkillWithoutProgression(skillCatalog, skill));

const clampRangeValues = (
  context: ExerciseValueContext,
  data: ExerciseValuesData,
): ExerciseValuesData => {
  const result = { ...data };
  for (const valueName of RANGE_VALUE_NAMES) {
    const value = result[valueName];
    if (typeof value === "number") {
      result[valueName] = clampValueToStartAndTarget(value, valueName, context);
    }
  }
  return result;
};

/**
 * Reads the values an exercise starts the next session with. Each source
 * overrides the one before: the intensity's start values, the exercise's
 * authored start values, the athlete's stored values. Repetitions and
 * duration then stay within start and target, except for max strength and
 * skills without progression in the given catalog; the speed warm-up caps
 * its duration. Without a skill the values always clamp.
 */
export const readExerciseValues = (
  context: ExerciseValueContext,
  storedValues: UserExerciseDataType | null,
  skillCatalog: SkillCatalog,
  skill?: string,
): ExerciseValuesData => {
  const defaults: ExerciseValuesData = context.intensity
    ? readIntensityDefaults(context.intensity, context)
    : { weightType: "weightAbsolute" };
  const authored = applyAuthoredStartValues(context, defaults);
  const stored = storedValues
    ? applyStoredValues(context, authored, storedValues)
    : authored;
  const clamped = isClampedSkill(skillCatalog, skill)
    ? clampRangeValues(context, stored)
    : stored;
  if (skill !== SPEED_WARM_UP_SKILL || clamped.duration === undefined) {
    return clamped;
  }
  return {
    ...clamped,
    duration: Math.min(clamped.duration, SPEED_WARM_UP_MAX_DURATION),
  };
};
