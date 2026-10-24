import type { ExerciseType } from "@/schemas/exercise.schema";

export interface ValueExerciseOptions {
  withWeights?: boolean;
  tags?: string[];
  values?: ExerciseType["values"];
  isJump?: boolean;
}

/**
 * Builds an exercise that advances by repetitions or by duration.
 *
 * generateValueExercise("repetition", { withWeights: true })
 * → { id: "1", tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_TYPE_WEIGHTS"],
 *     isAdvanceByReps: true, isAdvanceByDuration: false, values: {}, ... }
 */
export const generateValueExercise = (
  mode: "repetition" | "duration",
  {
    withWeights = false,
    tags = [],
    values = {},
    isJump = false,
  }: ValueExerciseOptions = {},
): ExerciseType => ({
  id: "1",
  name: "Test Exercise",
  displayName: "Test Exercise",
  description: "Test Description",
  picture: "test.jpg",
  video: "test.mp4",
  level: { m: 1, w: 1 },
  tags: [
    "REGION_UPPER_BODY",
    "SIDE_BOTH",
    ...(withWeights ? ["EQ_TYPE_WEIGHTS"] : []),
    ...tags,
  ],
  isAdvanceByReps: mode === "repetition",
  isAdvanceByDuration: mode === "duration",
  isJump,
  values,
});

/**
 * Builds the authored start and target entry of one exercise value.
 *
 * generateAuthoredValues("15", "80")
 * → { startValue: { default: { default: "15" }, m: { default: "15" } },
 *     targetValue: { default: { default: "80" }, m: { default: "80" } } }
 */
export const generateAuthoredValues = (start: string, target: string) => ({
  startValue: { default: { default: start }, m: { default: start } },
  targetValue: { default: { default: target }, m: { default: target } },
});
