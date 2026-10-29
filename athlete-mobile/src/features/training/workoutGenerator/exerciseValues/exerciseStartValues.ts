import { WorkoutConstants } from "@/constants/workoutConstants";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GenderTag } from "@/features/training/models/Intensity";
import type { ExerciseProgressMapType } from "@/features/training/models/ExerciseProgress";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import {
  readExerciseProgress,
  readExpectedWeightType,
} from "@/features/training/utils/exerciseProgressLookup";
import {
  getUserBirthday,
  getUserGender,
} from "@/features/training/utils/userDataUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { BlockValues } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  DifficultyFeedbackType,
  ExerciseStartValues,
  ExerciseValuesData,
} from "@/schemas/generator.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import type { UserType } from "@/schemas/user.schema";
import { readExerciseValues } from "./exerciseValues";
import { adjustExerciseValuesByFeedback } from "./feedbackAdjustment";
import {
  isSkillWithoutProgression,
  readSkillCatalogEntry,
} from "../generationInput/skillCatalogEntry";
import { applyBlockValuesMode, readSkillIntensity } from "./skillIntensity";
import type { ExerciseValueContext } from "./startAndTargetValues";

// Start values of a skill whose catalog entry sets none.
const DEFAULT_START_REPETITIONS = 8;
const DEFAULT_START_DURATION = 30;

/** The inputs start values read; cardio passes no exercise data. */
export interface ExerciseStartValueSource {
  readonly skillCatalog: SkillCatalog;
  readonly athlete: UserType;
  readonly exerciseData: Readonly<ExerciseProgressMapType> | null;
}

/** The block values start values read. */
export interface ExerciseStartValueBlock {
  skill: string;
  setDuration?: number;
  values?: BlockValues;
}

/** Children read the child values, everyone else the values of their gender. */
export const readGenderTag = (athlete: UserType): GenderTag => {
  if (
    ageGroupFor(getUserBirthday(athlete)) === WorkoutConstants.AGE_GROUPS.CHILD
  ) {
    return "k";
  }
  return getUserGender(athlete) === "MALE" ? "m" : "w";
};

const readTimedStartValues = (
  reference: BranchExerciseReference,
  setDuration: number,
): ExerciseStartValues => ({
  tags: reference.branchTags,
  exerciseId: reference.exerciseId,
  branchId: reference.branchId,
  duration: setDuration,
  height: undefined,
  repetition: undefined,
  weight: undefined,
  weightType: "weightAbsolute",
});

const readFeedback = (
  skillCatalog: SkillCatalog,
  skill: string,
  stored: UserExerciseDataType | null,
): DifficultyFeedbackType | null =>
  isSkillWithoutProgression(skillCatalog, skill)
    ? null
    : (stored?.feedback?.difficulty ?? null);

const readCatalogStartValues = (
  source: ExerciseStartValueSource,
  { skill }: ExerciseStartValueBlock,
  reference: BranchExerciseReference,
  exercise: ExerciseType,
): ExerciseStartValues => {
  const entry = readSkillCatalogEntry(source.skillCatalog, skill);
  return {
    tags: reference.branchTags,
    exerciseId: reference.exerciseId,
    branchId: reference.branchId,
    duration: exercise.isAdvanceByDuration
      ? (entry?.startDuration ?? DEFAULT_START_DURATION)
      : undefined,
    height: undefined,
    repetition: exercise.isAdvanceByReps
      ? (entry?.startRepetitions ?? DEFAULT_START_REPETITIONS)
      : undefined,
    weight: undefined,
    weightType: "weightAbsolute",
  };
};

// 0 kg is a valid load at the bottom of the load range.
const mergeExerciseValues = (
  start: ExerciseStartValues,
  values: ExerciseValuesData,
): ExerciseStartValues => ({
  ...start,
  duration: values.duration || start.duration,
  height: values.height || start.height,
  repetition: values.repetition || start.repetition,
  weight: typeof values.weight === "number" ? values.weight : start.weight,
  weightType: values.weightType ?? start.weightType,
});

/**
 * Reads the values an exercise of a block starts with. A block set duration
 * replaces them with a plain timed set. Otherwise the catalog start values
 * apply, overridden by the exercise values, which the athlete's last feedback
 * moves one step unless the skill has no progression.
 */
export const readExerciseStartValues = (
  source: ExerciseStartValueSource,
  block: ExerciseStartValueBlock,
  reference: BranchExerciseReference,
  exercise: ExerciseType,
): ExerciseStartValues => {
  if (block.setDuration !== undefined) {
    return readTimedStartValues(reference, block.setDuration);
  }
  const { athlete, skillCatalog, exerciseData } = source;
  const context: ExerciseValueContext = {
    intensity: applyBlockValuesMode(
      readSkillIntensity(skillCatalog, block.skill, exercise),
      block.values,
    ),
    exercise,
    gender: readGenderTag(athlete),
    level: getUserLevel(athlete).toLowerCase(),
  };
  const stored = readExerciseProgress(
    exerciseData,
    block.skill,
    reference.exerciseId,
    readExpectedWeightType(exercise, context.intensity),
  );
  const values = readExerciseValues(context, stored, skillCatalog, block.skill);
  const feedback = readFeedback(skillCatalog, block.skill, stored);
  return mergeExerciseValues(
    readCatalogStartValues(source, block, reference, exercise),
    feedback
      ? adjustExerciseValuesByFeedback(
          values,
          context,
          feedback,
          athlete.workoutData?.maxValues ?? DEFAULT_MAX_VALUES,
        )
      : values,
  );
};
