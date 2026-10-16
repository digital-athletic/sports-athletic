import { TagGroups } from "@/constants/tagGroups";
import {
  type ExerciseDifficultyType,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { ActiveTrainingType } from "@/features/training/models/ActiveTraining";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { SkillCode } from "@/schemas/generator.schema";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";
import {
  getLowestPermittedWeight,
  getTargetWeight,
  getWeightType,
  isTargetLoadReached,
  type WeightStepOptions,
} from "./weightAdjustmentUtils";
import { getExerciseStartValue, getExerciseTargetValue } from "./workoutUtils";

export interface ExerciseAdjustmentContext {
  userLevel: TrainingLevelType;
  genderTag: GenderTag;
  ageGroup: string;
  levelTag?: string;
  /** F-Max of the exercise in kg. */
  maxValue?: number;
}

export type ExerciseAdjustmentResult =
  | { type: "LEVEL_UP" }
  | { type: "LEVEL_DOWN" }
  | { type: "INCREASE_WEIGHT"; nextWeightPercentage?: number }
  | { type: "DECREASE_WEIGHT"; nextWeightPercentage?: number }
  | {
      type: "NO_CHANGE";
      reason: "in_between_zone" | "max_reached" | "min_reached";
    }
  | { type: "CLEAR_FEEDBACK" };

/**
 * Determines if exercise saving should be skipped.
 */
export function shouldSkipExerciseSave(
  isPauseExercise: boolean,
  reps: number,
): { skip: boolean; reason?: "pause_exercise" | "test_exercise" } {
  if (isPauseExercise) {
    return { skip: true, reason: "pause_exercise" };
  }
  if (reps === -1) {
    return { skip: true, reason: "test_exercise" };
  }
  return { skip: false };
}

/**
 * Determines if exercise values should be increased based on workout type and skill.
 * Cardio has no feedback progression yet, so nothing is stored for it.
 */
export function shouldProcessExerciseValues(
  type: string | undefined,
  skill: SkillCode | undefined,
): boolean {
  if (!type || !skill) return false;
  if (skill.includes("CARDIO")) return false;
  if (WorkoutConstants.NO_INCREASE_WORKOUT_PLAN_TYPE.indexOf(type) !== -1)
    return false;
  if (
    WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(
      skill as (typeof WorkoutConstants.NO_INCREASE_SKILL_TYPE)[number],
    ) !== -1
  )
    return false;
  return true;
}

/**
 * Determines whether an exercise should show "too easy"/"too hard" feedback
 * controls: PLAN workouts key off the exercise's own skill, other workout
 * types key off the workout type itself.
 */
export function isFeedbackEligibleSkill(
  activeTraining: ActiveTrainingType | null,
  skill: SkillCode,
): boolean {
  // cardio shows only the checkmark
  if (skill.includes("CARDIO")) return false;
  if (activeTraining?.type === "PLAN") {
    return WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(skill) === -1;
  }
  if (activeTraining?.type) {
    return (
      WorkoutConstants.NO_INCREASE_WORKOUT_PLAN_TYPE.indexOf(
        activeTraining.type,
      ) === -1 && WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(skill) === -1
    );
  }
  return false;
}

/**
 * Derives the sequential flow's active exercise index. Skips a pause row
 * only if a later entry is already completed (checklist mode never marks
 * pauses). `treatIndexAsCompleted` reuses this for "what's next" lookahead.
 */
export function deriveActiveExerciseIndex(
  exerciseList: UserExerciseDataType[] | null,
  treatIndexAsCompleted?: number,
): number {
  if (!exerciseList || exerciseList.length === 0) return 0;

  const isCompleted = (exercise: UserExerciseDataType, index: number) =>
    exercise.completed || index === treatIndexAsCompleted;

  const firstIncomplete = exerciseList.findIndex(
    (exercise, index) => !isCompleted(exercise, index),
  );
  if (firstIncomplete === -1) return exerciseList.length - 1;

  const isStalePause =
    isPauseExercise(exerciseList[firstIncomplete].exerciseId) &&
    exerciseList.some(
      (exercise, index) =>
        index > firstIncomplete && isCompleted(exercise, index),
    );

  if (isStalePause) {
    const nextRealIncomplete = exerciseList.findIndex(
      (exercise, index) =>
        index > firstIncomplete &&
        !isCompleted(exercise, index) &&
        !isPauseExercise(exercise.exerciseId),
    );
    return nextRealIncomplete === -1 ? firstIncomplete : nextRealIncomplete;
  }

  return firstIncomplete;
}

/**
 * Calculates adjustment for standard (non-MAX, non-cardio) exercises.
 * A performed boundary only changes the level or weight when the feedback
 * points past it; everything else is left to the feedback ladder step.
 * Without feedback nothing changes.
 */
export function calculateStandardExerciseAdjustment(
  weight: number,
  duration: number,
  reps: number,
  exerciseData: ExerciseType,
  context: ExerciseAdjustmentContext,
  intensity: IntensityData,
  feedback: ExerciseDifficultyType,
  progress: StoredProgress = {},
): ExerciseAdjustmentResult {
  if (feedback === null)
    return { type: "NO_CHANGE", reason: "in_between_zone" };
  const hasWeights =
    getTagValues(exerciseData.tags, TagGroups.EQ_TYPE).indexOf("WEIGHTS") !==
    -1;
  const config: ExerciseConfig = { exerciseData, context, intensity };
  if (
    hasWeights &&
    feedback === "TOO_HARD" &&
    isTooHardExit(weight, config, progress.tooHardCount)
  ) {
    return { type: "LEVEL_DOWN" };
  }

  const boundsOf = (valueName: BoundedValue) =>
    getBounds(valueName, exerciseData, context, intensity);
  const performed: PerformedSet = {
    hasWeights,
    weight,
    performedLoad: progress.performedWeight,
    config,
    feedback,
  };

  const changes: (BoundaryChange | null)[] = [
    exerciseData.isAdvanceByDuration
      ? checkBoundaries(duration, boundsOf("duration"), performed)
      : null,
    exerciseData.isAdvanceByReps
      ? checkBoundaries(reps, boundsOf("repetition"), performed)
      : null,
  ];

  const change = BOUNDARY_CHANGE_PRIORITY.find((candidate) =>
    changes.includes(candidate),
  );
  if (change) return { type: change };

  return { type: "NO_CHANGE", reason: "in_between_zone" };
}

type BoundedValue = "duration" | "repetition";

interface Bounds {
  start: number | undefined;
  target: number | undefined;
}

/** Progress stored per exercise before this session. */
export interface StoredProgress {
  performedWeight?: number;
  /** Consecutive too hard ratings including the current one. */
  tooHardCount?: number;
}

interface ExerciseConfig {
  exerciseData: ExerciseType;
  context: ExerciseAdjustmentContext;
  intensity: IntensityData;
}

interface PerformedSet {
  hasWeights: boolean;
  weight: number;
  performedLoad: number | undefined;
  config: ExerciseConfig;
  feedback: ExerciseDifficultyType;
}

const FIXED_KILOGRAM_TOO_HARD_EXIT = 2;
const LOADED_JUMP_TOO_HARD_EXIT = 3;

// TOO_HARD leads to an easier exercise at the lowest permitted load, on the
// second one in a row for fixed kilograms and on the third for loaded jumps.
const isTooHardExit = (
  weight: number,
  { exerciseData, context, intensity }: ExerciseConfig,
  tooHardCount = 0,
): boolean => {
  const weightType = getWeightType(exerciseData, intensity);
  if (exerciseData.isJump) return tooHardCount >= LOADED_JUMP_TOO_HARD_EXIT;
  if (weightType === "weightAbsolute") {
    return tooHardCount >= FIXED_KILOGRAM_TOO_HARD_EXIT;
  }
  const lowestWeight = getLowestPermittedWeight(
    intensity,
    weightType,
    exerciseData,
    context,
  );
  return typeof lowestWeight === "number" && weight <= lowestWeight;
};

const getWeightOptions = (
  { exerciseData, context, intensity }: ExerciseConfig,
  performedLoad: number | undefined,
): WeightStepOptions => ({
  weightType: getWeightType(exerciseData, intensity),
  targetWeight: getTargetWeight(intensity, exerciseData, context),
  maxValue: context.maxValue,
  performedLoad,
});

const getBounds = (
  valueName: BoundedValue,
  exerciseData: ExerciseType,
  { userLevel, genderTag }: ExerciseAdjustmentContext,
  intensity: IntensityData,
): Bounds => ({
  start: getExerciseStartValue(
    intensity,
    exerciseData,
    valueName,
    userLevel,
    genderTag,
  ),
  target: getExerciseTargetValue(
    intensity,
    exerciseData,
    valueName,
    userLevel,
    genderTag,
  ),
});

// Reaching the target moves up unless the feedback was TOO_HARD.
const checkTarget = (
  value: number,
  target: number | undefined,
  { hasWeights, weight, performedLoad, config, feedback }: PerformedSet,
): BoundaryChange | null => {
  if (typeof target !== "number" || value < target || feedback === "TOO_HARD")
    return null;
  if (!hasWeights) return "LEVEL_UP";
  return isTargetLoadReached(
    weight,
    config.exerciseData,
    getWeightOptions(config, performedLoad),
  )
    ? "LEVEL_UP"
    : "INCREASE_WEIGHT";
};

// Falling below the start, or TOO_HARD at the start without weights, moves
// down unless the feedback was positive. With weights it lowers the weight.
const checkStart = (
  value: number,
  start: number | undefined,
  { hasWeights, feedback }: PerformedSet,
): BoundaryChange | null => {
  const isPositive = feedback === "SUCCEEDED" || feedback === "TOO_EASY";
  if (typeof start !== "number" || isPositive) return null;
  if (hasWeights) return value < start ? "DECREASE_WEIGHT" : null;
  const atStartTooHard = feedback === "TOO_HARD" && value === start;
  return value < start || atStartTooHard ? "LEVEL_DOWN" : null;
};

const checkBoundaries = (
  value: number,
  { start, target }: Bounds,
  performed: PerformedSet,
): BoundaryChange | null =>
  checkTarget(value, target, performed) ?? checkStart(value, start, performed);

type BoundaryChange =
  | "LEVEL_UP"
  | "LEVEL_DOWN"
  | "INCREASE_WEIGHT"
  | "DECREASE_WEIGHT";

const BOUNDARY_CHANGE_PRIORITY: BoundaryChange[] = [
  "LEVEL_UP",
  "LEVEL_DOWN",
  "INCREASE_WEIGHT",
  "DECREASE_WEIGHT",
];
