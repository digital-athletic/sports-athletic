import type { LevelTag } from "@/constants/workoutConstants";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateGenerationInput } from "./generationInput";
import { generateMaxValues } from "./maxValues";
import { generateSequenceRandom } from "./sequenceRandom";
import { findCatalogExerciseById, SQUAT_EXERCISE_ID } from "./valueExercise";

export interface MaxStrengthInputOptions {
  level?: LevelTag;
  oneRepMax?: number;
  supportExercises?: ExerciseType[];
  exerciseData?: Record<string, UserExerciseDataType>;
  draws?: number[];
  /** Leaves out the workout data, as an athlete who skipped the anamnesis. */
  withoutWorkoutData?: boolean;
}

/**
 * Builds the generation input of an adult man at home whose squat has the
 * given 1RM, with the squat and the support exercises as catalog. The random
 * returns the draws in order and fails on one draw more.
 *
 * generateMaxStrengthInput({ oneRepMax: 100, draws: [0] })
 * → { athlete: { workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] },
 *       maxValues: { kneeDominant: { barbell: 100, ... }, ... } } },
 *     place: "HOME", exerciseCatalog: [squat], random: () => 0, ... }
 */
export const generateMaxStrengthInput = ({
  level,
  oneRepMax,
  supportExercises = [],
  exerciseData,
  draws = [],
  withoutWorkoutData,
}: MaxStrengthInputOptions = {}): GenerationInput =>
  generateGenerationInput({
    level,
    withoutWorkoutData,
    maxValues: generateMaxValues(
      oneRepMax === undefined ? {} : { kneeDominant: oneRepMax },
    ),
    place: "HOME",
    exerciseCatalog: [
      findCatalogExerciseById(SQUAT_EXERCISE_ID),
      ...supportExercises,
    ],
    exerciseData,
    random: generateSequenceRandom(draws),
  });
