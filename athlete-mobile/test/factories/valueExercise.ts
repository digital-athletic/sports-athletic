import { loadExercises } from "@/data/loadExercises";
import type { ExerciseType } from "@/schemas/exercise.schema";

/**
 * Finds an exercise of the bundled catalog and fails the spec when it is gone.
 *
 * findCatalogExerciseById("721")
 * → { id: "721", isAdvanceByDuration: true, values: { duration: { startValue: ... } }, ... }
 */
export const findCatalogExerciseById = (id: string): ExerciseType => {
  const exercise = loadExercises().find((entry) => entry.id === id);
  if (!exercise) throw new Error(`Exercise ${id} missing from the catalog`);
  return exercise;
};

export interface ValueExerciseOptions {
  id?: string;
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
    id = "1",
    withWeights = false,
    tags = [],
    values = {},
    isJump = false,
  }: ValueExerciseOptions = {},
): ExerciseType => ({
  id,
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
 * Builds a catalog exercise that advances by repetitions, with exactly the
 * given tags. The overrides replace any field.
 *
 * generateTaggedExercise("e1", ["SIDE_BOTH"])
 * → { id: "e1", tags: ["SIDE_BOTH"], isAdvanceByReps: true, values: {}, ... }
 */
export const generateTaggedExercise = (
  id: string,
  tags: string[],
  overrides: Partial<ExerciseType> = {},
): ExerciseType => ({
  ...generateValueExercise("repetition", { id }),
  tags,
  ...overrides,
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
