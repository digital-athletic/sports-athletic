import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateValueExercise } from "./valueExercise";

/**
 * Builds a repetition exercise that authors its start weight in the given
 * unit, so the exercise wins over the intensity.
 *
 * generateAuthoredUnitExercise("weightFMax")
 * → { id: "1", values: { weight: { startValue: { type: { type: "weightFMax" } }, targetValue: {} } }, ... }
 */
export const generateAuthoredUnitExercise = (
  type: "weightFMax" | "weightAbsolute",
): ExerciseType =>
  generateValueExercise("repetition", {
    values: {
      weight: { startValue: { type: { type } }, targetValue: {} },
    },
  });
