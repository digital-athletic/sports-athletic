import {
  type AgeGroupTag,
  type ExerciseDifficultyType,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import { getLastMaxFRep } from "./maxFRepetitionsUtils";
import { getMaxStrengthExerciseEnd } from "./maxStrengthLadder";

export interface MaxStrengthAdjustmentInput {
  /** Feedback difficulty entered for the exercise this session. */
  adjustment: ExerciseDifficultyType;
  /** The persisted user exercise entry holding maxFRepetitions. */
  userExerciseData: UserExerciseDataType | undefined;
  ageGroup: AgeGroupTag;
  levelTag: LevelTag | undefined;
}

export interface MaxStrengthAdjustmentResult {
  /** The user's existing maxFRepetitions, carried over unchanged. */
  maxFRepetitions: MaxForceRepetitionsDataType[];
  levelUp: boolean;
  levelDown: boolean;
  /** Feedback the caller must persist before the main update; undefined skips it. */
  feedbackOverride?: { difficulty: ExerciseDifficultyType };
}

/**
 * Pure inter-session progression for MAX (Maximalkraft) exercises. The weights
 * of the next session follow from the stored sets and the feedback; this only
 * decides whether the exercise switches at its final value or at the floor.
 */
export function calculateMaxStrengthAdjustment(
  input: MaxStrengthAdjustmentInput,
): MaxStrengthAdjustmentResult {
  const { adjustment, userExerciseData, ageGroup, levelTag } = input;
  const maxFRepetitions = userExerciseData?.maxFRepetitions ?? [];
  const level = levelTag ?? WorkoutConstants.LEVELS.ADVANCED;
  const table =
    WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[ageGroup]?.[
      level
    ] ?? {};

  const end = getMaxStrengthExerciseEnd(
    table,
    level,
    getLastMaxFRep(maxFRepetitions),
    adjustment,
  );

  return {
    maxFRepetitions,
    levelUp: end === "FINAL_VALUE",
    levelDown: end === "FLOOR",
    // Without a replacement exercise the sets stay where they are.
    feedbackOverride: end ? { difficulty: null } : undefined,
  };
}
