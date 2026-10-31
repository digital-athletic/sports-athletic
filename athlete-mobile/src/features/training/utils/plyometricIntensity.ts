import type { SkillTreeType } from "@/schemas/skillTree.schema";

// Plyometric intensities are tags inside the PLYO tree; medium and low are one category
const PLYOMETRIC_INTENSITY_TAGS: Readonly<Record<string, readonly string[]>> = {
  PLYO_HIGH: ["SKILL_PLYO_HIGH"],
  PLYO_MEDIUM: ["SKILL_PLYO_MEDIUM", "SKILL_PLYO_LOW"],
  PLYO_LOW: ["SKILL_PLYO_MEDIUM", "SKILL_PLYO_LOW"],
};

export const isPlyometricIntensity = (skill: string): boolean =>
  Object.hasOwn(PLYOMETRIC_INTENSITY_TAGS, skill);

/**
 * Keeps the branches of a PLYO tree that carry a tag of the skill's
 * plyometric intensity. Any other skill keeps the whole tree.
 *
 * keepPlyometricIntensity(plyoTree, "PLYO_HIGH") → the SKILL_PLYO_HIGH branches
 */
export const keepPlyometricIntensity = (
  tree: SkillTreeType,
  skill: string,
): SkillTreeType => {
  if (!isPlyometricIntensity(skill)) return tree;
  const intensityTags = PLYOMETRIC_INTENSITY_TAGS[skill];
  return Object.fromEntries(
    Object.entries(tree).filter(([, { tags }]) =>
      tags.some((tag) => intensityTags.includes(tag)),
    ),
  );
};
