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
  ...generateValueExercise("duration", { id }),
  tags: [
    "SKILL_SUPPORT",
    "REGION_CORE",
    "MUSCLE_RECTUS_ABDOMINIS",
    "SIDE_BOTH",
    ...extraTags,
  ],
  ...overrides,
});

/**
 * Builds a weighted support exercise: dumbbells as equipment and weights as
 * equipment type.
 *
 * generateWeightedSupportExercise("w1")
 * → { id: "w1", tags: [..., "EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"], ... }
 */
export const generateWeightedSupportExercise = (
  id: string,
  overrides: Partial<ExerciseType> = {},
): ExerciseType =>
  generateSupportExercise(id, ["EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"], overrides);

/**
 * Builds a support exercise "w1" whose start weight is 12 kg for an advanced
 * man, 8 kg for an advanced woman and 4 kg for a child.
 *
 * generateAuthoredWeightSupportExercise(["EQ_TYPE_WEIGHTS"])
 * → { id: "w1", tags: [..., "EQ_TYPE_WEIGHTS"],
 *     values: { weight: { startValue: { m: { advanced: 12 }, ... } } }, ... }
 */
export const generateAuthoredWeightSupportExercise = (
  tags: string[],
): ExerciseType =>
  generateSupportExercise("w1", tags, {
    values: {
      weight: {
        startValue: {
          m: { advanced: 12 },
          w: { advanced: 8 },
          k: { default: 4 },
        },
        targetValue: {},
      },
    },
  });
