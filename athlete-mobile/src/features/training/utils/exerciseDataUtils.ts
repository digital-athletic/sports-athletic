import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ActiveTrainingType } from "@/features/training/models/ActiveTraining";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { SkillCode } from "@/schemas/generator.schema";
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
 */
export function calculateStandardExerciseAdjustment(
  weight: number,
  duration: number,
  reps: number,
  exerciseData: ExerciseType,
  context: ExerciseAdjustmentContext,
  intensity: IntensityData,
): ExerciseAdjustmentResult {
  const { userLevel, genderTag } = context;

  const eqTypes = getTagValues(exerciseData.tags, TagGroups.EQ_TYPE);
  const hasWeights = eqTypes.indexOf("WEIGHTS") !== -1;

  // Get target and start values
  const targetDuration = getExerciseTargetValue(
    intensity,
    exerciseData,
    "duration",
    userLevel,
    genderTag,
  );
  const startDuration = getExerciseStartValue(
    intensity,
    exerciseData,
    "duration",
    userLevel,
    genderTag,
  );
  const targetReps = getExerciseTargetValue(
    intensity,
    exerciseData,
    "repetition",
    userLevel,
    genderTag,
  );
  const startReps = getExerciseStartValue(
    intensity,
    exerciseData,
    "repetition",
    userLevel,
    genderTag,
  );
  const targetWeight = getExerciseTargetValue(
    intensity,
    exerciseData,
    "weight",
    userLevel,
    genderTag,
  );
  const startWeight = getExerciseStartValue(
    intensity,
    exerciseData,
    "weight",
    userLevel,
    genderTag,
  );

  let levelUp = false;
  let levelDown = false;
  let increaseWeight = false;
  let decreaseWeight = false;

  // Check duration-based progression
  if (exerciseData.isAdvanceByDuration) {
    if (!hasWeights) {
      if (typeof targetDuration === "number" && duration >= targetDuration) {
        levelUp = true;
      }
      if (typeof startDuration === "number" && duration < startDuration) {
        levelDown = true;
      }
    } else {
      if (typeof targetDuration === "number" && duration >= targetDuration) {
        if (typeof targetWeight === "number" && weight >= targetWeight) {
          levelUp = true;
        } else {
          increaseWeight = true;
        }
      }
      if (typeof startDuration === "number" && duration < startDuration) {
        if (typeof startWeight === "number" && weight < startWeight) {
          levelDown = true;
        } else {
          decreaseWeight = true;
        }
      }
    }
  }

  // Check repetition-based progression
  if (exerciseData.isAdvanceByReps) {
    if (!hasWeights) {
      if (typeof targetReps === "number" && reps >= targetReps) {
        levelUp = true;
      }
      if (typeof startReps === "number" && reps < startReps) {
        levelDown = true;
      }
    } else {
      if (typeof targetReps === "number" && reps >= targetReps) {
        if (typeof targetWeight === "number" && weight >= targetWeight) {
          levelUp = true;
        } else {
          increaseWeight = true;
        }
      }
      if (typeof startReps === "number" && reps < startReps) {
        if (typeof startWeight === "number" && weight < startWeight) {
          levelDown = true;
        } else {
          decreaseWeight = true;
        }
      }
    }
  }

  if (levelUp) return { type: "LEVEL_UP" };
  if (levelDown) return { type: "LEVEL_DOWN" };
  if (increaseWeight) return { type: "INCREASE_WEIGHT" };
  if (decreaseWeight) return { type: "DECREASE_WEIGHT" };

  return { type: "NO_CHANGE", reason: "in_between_zone" };
}

/**
 * Calculates new weight value after adjustment.
 */
export function calculateNewWeight(
  currentWeight: number,
  adjustment: "SUCCEEDED" | "TOO_HARD",
  exerciseData: ExerciseType,
  intensity: IntensityData,
): number {
  const isWeightFMax =
    (exerciseData.values?.weight?.startValue.type &&
      exerciseData.values.weight.startValue.type.type === "weightFMax") ||
    (!exerciseData.values?.weight?.startValue.type &&
      intensity.startValue.weight?.type &&
      intensity.startValue.weight.type.type === "weightFMax");

  if (isWeightFMax) {
    const weightFMaxAdjustment =
      intensity.adjustment.weightFMax?.default?.default?.[adjustment];
    if (typeof weightFMaxAdjustment === "number") {
      return currentWeight + weightFMaxAdjustment;
    }
  } else {
    const weightAbsoluteAdjustment =
      intensity.adjustment.weightAbsolute?.default?.default?.[adjustment];
    if (typeof weightAbsoluteAdjustment === "number") {
      return currentWeight + weightAbsoluteAdjustment;
    }
  }

  return currentWeight;
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
