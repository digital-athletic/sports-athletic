import { WorkoutConstants } from "@/constants/workoutConstants";
import type {
  SkillCatalog,
  SkillCatalogEntry,
} from "@/schemas/skillCatalog.schema";

/**
 * Reads an entry of the given skill catalog. Object.hasOwn keeps prototype
 * keys like "constructor" from matching.
 */
export const readSkillCatalogEntry = (
  skillCatalog: SkillCatalog,
  skill: string,
): SkillCatalogEntry | undefined =>
  Object.hasOwn(skillCatalog, skill)
    ? skillCatalog[skill as keyof SkillCatalog]
    : undefined;

/**
 * A skill without progression keeps its stored values and ignores feedback:
 * the fixed list of warm-up and test skills, and every skill whose catalog
 * entry turns progression off.
 */
export const isSkillWithoutProgression = (
  skillCatalog: SkillCatalog,
  skill: string,
): boolean =>
  WorkoutConstants.NO_INCREASE_SKILL_TYPE.includes(skill) ||
  readSkillCatalogEntry(skillCatalog, skill)?.progression === false;
