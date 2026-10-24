import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { hasSkillTree, type SkillCatalog } from "@/schemas/skillCatalog.schema";

/**
 * Copies the bundled skill catalog with the progression flag of one skill
 * tree entry set. Timing-only entries hold no progression flag.
 *
 * generateCatalogWithProgression("WU", true)
 * → { ..., WU: { skillTree: { ... }, progression: true, ... }, ... }
 */
export const generateCatalogWithProgression = (
  skill: string,
  progression: boolean,
): SkillCatalog => {
  const skillCatalog = loadSkillCatalog();
  const entry = skillCatalog[skill];
  if (!entry || !hasSkillTree(entry)) {
    throw new Error(`Skill ${skill} has no skill tree entry`);
  }
  return { ...skillCatalog, [skill]: { ...entry, progression } };
};
