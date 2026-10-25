import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { ExerciseStartValueSource } from "@/features/training/workoutGenerator/exerciseStartValues";
import { generateAthleteWithMaxValues } from "./athlete";

/**
 * Builds the inputs the exercise start values read: the bundled skill
 * catalog, an adult man at fitness level BEGINNER and no exercise data. The
 * overrides replace any field.
 *
 * generateExerciseStartValueSource({ exerciseData: { "1": { ... } } })
 * → { skillCatalog: <bundled>, athlete: { userId: "athlete", ... }, exerciseData: { "1": { ... } } }
 */
export const generateExerciseStartValueSource = (
  overrides: Partial<ExerciseStartValueSource> = {},
): ExerciseStartValueSource => ({
  skillCatalog: loadSkillCatalog(),
  athlete: generateAthleteWithMaxValues(),
  exerciseData: null,
  ...overrides,
});
