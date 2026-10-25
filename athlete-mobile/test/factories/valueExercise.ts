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
 * Builds an exercise that advances by repetitions and uses the given
 * equipment. Weighted exercises carry the weights equipment type.
 *
 * generateEquipmentExercise("BARBELL", { withWeights: true })
 * → { id: "1", tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_TYPE_WEIGHTS", "EQ_BARBELL"], ... }
 */
export const generateEquipmentExercise = (
  equipment: string,
  options: Omit<ValueExerciseOptions, "tags"> = {},
): ExerciseType =>
  generateValueExercise("repetition", {
    ...options,
    tags: [`EQ_${equipment}`],
  });

/**
 * Builds the exercise a label names, or none: a weighted or a bodyweight
 * exercise that advances by repetitions.
 *
 * generateLabelledExercise("weighted")
 * → { id: "1", tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_TYPE_WEIGHTS"], ... }
 */
export const generateLabelledExercise = (
  label: "weighted" | "bodyweight" | "none",
): ExerciseType | undefined =>
  label === "none"
    ? undefined
    : generateValueExercise("repetition", {
        withWeights: label === "weighted",
      });

// The barbell back squat; with a 1RM of 100 kg every kg value equals its
// weight percentage.
export const SQUAT_EXERCISE_ID = "26";

/**
 * Builds the squat that the max strength ladder and its set list builder
 * read stored data for.
 *
 * generateSquatExercise() → { id: "26", isAdvanceByReps: true, ... }
 */
export const generateSquatExercise = (): ExerciseType =>
  generateValueExercise("repetition", { id: SQUAT_EXERCISE_ID });

/**
 * Builds the main lift that support exercises rest around: a squat on the
 * quadriceps.
 *
 * generateMainLiftExercise()
 * → { id: "26", tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "MUSCLE_QUADRICEPS", "REGION_LOWER_BODY"], ... }
 */
export const generateMainLiftExercise = (): ExerciseType => {
  const squat = generateSquatExercise();
  return {
    ...squat,
    tags: [...squat.tags, "MUSCLE_QUADRICEPS", "REGION_LOWER_BODY"],
  };
};

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
