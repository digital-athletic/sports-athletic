import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import type { IntensityData } from "@/features/training/models/Intensity";
import type { BlockValues } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { isWeightedExercise } from "./exerciseValues";
import { readSkillCatalogEntry } from "../generationInput/skillCatalogEntry";

type TaggedExercise = Pick<ExerciseType, "tags">;

// Plyometric tree keys, not part of the stored skill codes.
const PLYOMETRIC_SKILLS = ["PLYO_HIGH", "PLYO_MEDIUM"];
const HYPERTROPHY_SKILLS = ["SWR1", "SWR1KG", "SWR2", "SWR2KG"];

// Hypertrophy trees mix weighted and bodyweight exercises, so a known exercise
// picks the config by its equipment type instead of by the skill.
const readHypertrophyIntensity = (
  skill: string,
  exercise: TaggedExercise | undefined,
) => {
  if (!exercise) {
    return loadIntensityConfig(skill === "SWR2KG" ? "SWR2KG" : "SWR2");
  }
  return loadIntensityConfig(isWeightedExercise(exercise) ? "SWR2" : "SWR2KG");
};

/**
 * Reads the intensity config of a skill: plyometrics and hypertrophy by fixed
 * names, every other skill by its catalog entry, with the entry's config for
 * exercises without weights where it names one. Skills without an entry read
 * DEFAULTKG.
 */
export const readSkillIntensity = (
  skillCatalog: SkillCatalog,
  skill: string,
  exercise?: TaggedExercise,
): IntensityData => {
  if (PLYOMETRIC_SKILLS.includes(skill)) return loadIntensityConfig("PLYO");
  if (HYPERTROPHY_SKILLS.includes(skill)) {
    return readHypertrophyIntensity(skill, exercise);
  }
  const entry = readSkillCatalogEntry(skillCatalog, skill);
  const withoutWeights = exercise && !isWeightedExercise(exercise);
  return loadIntensityConfig(
    (withoutWeights && entry?.intensityWithoutWeights) ||
      entry?.intensity ||
      "DEFAULTKG",
  );
};

/**
 * Applies the values mode of a block: "skill" takes repetitions and durations
 * from the skill range, "exercise" from the exercise. Without a mode the
 * intensity config decides.
 */
export const applyBlockValuesMode = (
  intensity: IntensityData,
  values: BlockValues | undefined,
): IntensityData =>
  values === undefined
    ? intensity
    : { ...intensity, overridesExerciseRepsAndDuration: values === "skill" };
