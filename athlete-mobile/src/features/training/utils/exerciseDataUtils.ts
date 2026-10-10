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
  getExerciseStartValue,
  getExerciseTargetValue,
  getValueByGenderAndLevel,
} from "./workoutUtils";

export interface ExerciseAdjustmentContext {
  userLevel: TrainingLevelType;
  genderTag: GenderTag;
  ageGroup: string;
  levelTag?: string;
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
 */
export function shouldProcessExerciseValues(
  type: string | undefined,
  skill: SkillCode | undefined,
): boolean {
  if (!type || !skill) return false;
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
  if (activeTraining?.type === "PLAN") {
    return WorkoutConstants.NO_INCREASE_SKILL_TYPE.indexOf(skill) === -1;
  }
  if (activeTraining?.type) {
    return (
      WorkoutConstants.NO_INCREASE_WORKOUT_PLAN_TYPE.indexOf(
        activeTraining.type,
      ) === -1
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
 * Finds the main cardio exercise by walking back through the exercise list.
 */
export function findMainCardioExercise(
  exerciseList: UserExerciseDataType[] | null,
  startIndex: number,
): { branchId: string; exerciseId: string } | null {
  if (!exerciseList) return null;

  let pointer = startIndex;
  while (pointer > -1) {
    const exercise = exerciseList[pointer];
    if (exercise && exercise.skill?.includes("CARDIO")) {
      if (typeof exercise.branchId === "string" && exercise.branchId !== "-1") {
        return { branchId: exercise.branchId, exerciseId: exercise.exerciseId };
      }
    }
    pointer--;
  }
  return null;
}

/**
 * Calculates adjustment for standard (non-MAX, non-cardio) exercises.
 * A performed boundary only changes the level or weight when the feedback
 * points past it; everything else is left to the feedback ladder step.
 */
export function calculateStandardExerciseAdjustment(
  weight: number,
  duration: number,
  reps: number,
  exerciseData: ExerciseType,
  context: ExerciseAdjustmentContext,
  intensity: IntensityData,
  feedback: ExerciseDifficultyType,
): ExerciseAdjustmentResult {
  const boundsOf = (valueName: BoundedValue) =>
    getBounds(valueName, exerciseData, context, intensity);
  const performed: PerformedSet = {
    hasWeights:
      getTagValues(exerciseData.tags, TagGroups.EQ_TYPE).indexOf("WEIGHTS") !==
      -1,
    weight,
    weightBounds: boundsOf("weight"),
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

type BoundedValue = "duration" | "repetition" | "weight";

interface Bounds {
  start: number | undefined;
  target: number | undefined;
}

interface PerformedSet {
  hasWeights: boolean;
  weight: number;
  weightBounds: Bounds;
  feedback: ExerciseDifficultyType;
}

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
  { hasWeights, weight, weightBounds, feedback }: PerformedSet,
): BoundaryChange | null => {
  if (typeof target !== "number" || value < target || feedback === "TOO_HARD")
    return null;
  if (!hasWeights) return "LEVEL_UP";
  const targetWeight = weightBounds.target;
  return typeof targetWeight === "number" && weight >= targetWeight
    ? "LEVEL_UP"
    : "INCREASE_WEIGHT";
};

// Falling below the start, or TOO_HARD at the start without weights, moves
// down unless the feedback was positive.
const checkStart = (
  value: number,
  start: number | undefined,
  { hasWeights, weight, weightBounds, feedback }: PerformedSet,
): BoundaryChange | null => {
  const isPositive = feedback === "SUCCEEDED" || feedback === "TOO_EASY";
  if (typeof start !== "number" || isPositive) return null;
  if (!hasWeights) {
    const atStartTooHard = feedback === "TOO_HARD" && value === start;
    return value < start || atStartTooHard ? "LEVEL_DOWN" : null;
  }
  if (value >= start) return null;
  const startWeight = weightBounds.start;
  return typeof startWeight === "number" && weight < startWeight
    ? "LEVEL_DOWN"
    : "DECREASE_WEIGHT";
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
