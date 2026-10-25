import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateValueExercise } from "./valueExercise";

/**
 * Builds a two sided core support exercise advanced by duration. Extra tags
 * join the default tags; `tags` in the overrides replaces them.
 *
 * generateSupportExercise("s1", ["EQ_DUMBBELL"])
 * → { id: "s1", displayName: "Test Exercise", isAdvanceByReps: false,
 *     tags: ["SKILL_SUPPORT", "REGION_CORE", "MUSCLE_RECTUS_ABDOMINIS", "SIDE_BOTH", "EQ_DUMBBELL"], ... }
 */
export const generateSupportExercise = (
  id: string,
  extraTags: string[] = [],
  overrides: Partial<ExerciseType> = {},
): ExerciseType => ({
  ...generateValueExercise("duration"),
  id,
  tags: [
    "SKILL_SUPPORT",
    "REGION_CORE",
    "MUSCLE_RECTUS_ABDOMINIS",
    "SIDE_BOTH",
    ...extraTags,
  ],
  ...overrides,
});
