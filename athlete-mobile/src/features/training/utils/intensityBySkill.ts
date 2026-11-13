import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { IntensityData } from "@/features/training/models/Intensity";
import { readSkillIntensity } from "@/features/training/workoutGenerator/exerciseValues/skillIntensity";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";

// Plyometric tree keys, not part of the stored skill codes.
type PlyometricSkill = "PLYO_HIGH" | "PLYO_MEDIUM";

/**
 * Reads the intensity config of a skill from the bundled skill catalog, the
 * same config the workout generator reads. The exercise picks the config for
 * exercises without weights where the skill names one.
 *
 * getIntensityBySkill("PLYO_HIGH") → the PLYO intensity config
 */
export const getIntensityBySkill = (
  skill: SkillCode | PlyometricSkill,
  exercise?: Pick<ExerciseType, "tags">,
): IntensityData => readSkillIntensity(loadSkillCatalog(), skill, exercise);
