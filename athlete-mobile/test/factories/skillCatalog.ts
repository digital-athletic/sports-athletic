import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import {
  hasSkillTree,
  type SkillCatalog,
  type SkillTreeCatalogEntry,
} from "@/schemas/skillCatalog.schema";

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

/**
 * Builds a skill catalog entry that sets every default, reading tree T_W with
 * weights and tree T_A without. The overrides replace any field.
 *
 * generateTreeCatalogEntry({ sets: 4 })
 * → { skillTree: { withWeights: ["T_W"], withoutWeights: ["T_A"] }, countBy: "entries",
 *     fallbackToWholeTree: false, superset: "none", sets: 4,
 *     rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 } }
 */
export const generateTreeCatalogEntry = (
  overrides: Partial<SkillTreeCatalogEntry> = {},
): SkillTreeCatalogEntry => ({
  skillTree: { withWeights: ["T_W"], withoutWeights: ["T_A"] },
  countBy: "entries",
  fallbackToWholeTree: false,
  superset: "none",
  sets: 2,
  rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 },
  ...overrides,
});

/**
 * Builds a catalog where WU_X reads the special warm-up tree, PREV_X is a
 * prevention skill for the knee and OTHER_X names the knee without being one.
 *
 * generateSpecialWarmUpCatalog()
 * → { WU_X: { skillTree: { withWeights: ["WUSPEZIAL"], ... }, ... },
 *     PREV_X: { focusArea: "PREVENTION", painRegions: ["KNEE"], ... },
 *     OTHER_X: { painRegions: ["KNEE"], ... } }
 */
export const generateSpecialWarmUpCatalog = (): SkillCatalog => ({
  WU_X: generateTreeCatalogEntry({
    skillTree: { withWeights: ["WUSPEZIAL"], withoutWeights: ["WUSPEZIAL"] },
  }),
  PREV_X: generateTreeCatalogEntry({
    focusArea: "PREVENTION",
    painRegions: ["KNEE"],
  }),
  OTHER_X: generateTreeCatalogEntry({ painRegions: ["KNEE"] }),
});
