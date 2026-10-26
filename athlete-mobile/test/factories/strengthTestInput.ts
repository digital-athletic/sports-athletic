import { loadExercises } from "@/data/loadExercises";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import {
  generateGenerationInput,
  type GenerationInputFactoryOptions,
} from "./generationInput";

/** The equipment a place needs for the lifts of the bundled strength test. */
export const STRENGTH_TEST_EQUIPMENT = [
  "BARBELL",
  "POWER_RACK",
  "BARBELL_BENCH",
];

const REAL_EXERCISES = loadExercises();

/**
 * Builds the generation input of a strength test: the real exercise catalog
 * and a studio with a barbell, a power rack and a bench. The options replace
 * any default of the generation input.
 *
 * generateStrengthTestInput({ level: "BEGINNER", gender: "FEMALE" })
 * → { athlete: { personalData: { gender: "FEMALE", ... }, workoutData: { tags: { LEVEL: ["BEGINNER"], ... } } },
 *     place: "STUDIO", equipment: ["BARBELL", "POWER_RACK", "BARBELL_BENCH"], exerciseCatalog: [...real exercises], ... }
 */
export const generateStrengthTestInput = (
  options: GenerationInputFactoryOptions = {},
): GenerationInput =>
  generateGenerationInput({
    equipment: STRENGTH_TEST_EQUIPMENT,
    exerciseCatalog: REAL_EXERCISES,
    ...options,
  });
