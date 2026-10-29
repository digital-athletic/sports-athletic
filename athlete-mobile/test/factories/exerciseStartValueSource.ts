import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { ExerciseStartValueSource } from "@/features/training/workoutGenerator/exerciseValues/exerciseStartValues";
import { generateAthleteWithMaxValues } from "./athlete";

/**
 * Builds the inputs the exercise start values read: the bundled skill
 * catalog, an adult man at fitness level BEGINNER and no stored progress. The
 * overrides replace any field.
 *
 * generateExerciseStartValueSource({ storedProgress: generateStoredProgress(...) })
 * → { skillCatalog: <bundled>, athlete: { userId: "athlete", ... }, storedProgress: { exerciseProgress: { ... }, exerciseData: {} } }
 */
export const generateExerciseStartValueSource = (
  overrides: Partial<ExerciseStartValueSource> = {},
): ExerciseStartValueSource => ({
  skillCatalog: loadSkillCatalog(),
  athlete: generateAthleteWithMaxValues(),
  storedProgress: null,
  ...overrides,
});
