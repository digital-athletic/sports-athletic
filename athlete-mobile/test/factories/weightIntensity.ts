import type { IntensityData } from "@/features/training/models/Intensity";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateValueExercise } from "./valueExercise";

/**
 * Builds an intensity whose start weight has the given unit.
 *
 * generateWeightIntensity("weightFMax")
 * → { adjustment: {}, startValue: { weight: { type: { type: "weightFMax" } } }, targetValue: {} }
 */
export const generateWeightIntensity = (
  type: "weightFMax" | "weightAbsolute",
): IntensityData => ({
  adjustment: {},
  startValue: { weight: { type: { type } } },
  targetValue: {},
});

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
