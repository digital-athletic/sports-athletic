import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";

/**
 * Builds a skill tree branch with the given tags and levels. The default is
 * one level with the exercise "e1".
 *
 * generateSkillBranch(["PREVENTION_KNEE"])
 * → { tags: ["PREVENTION_KNEE"], levels: { 1: { exerciseId: "e1" } } }
 */
export const generateSkillBranch = (
  tags: string[] = [],
  levels: SkillBranchType["levels"] = { 1: { exerciseId: "e1" } },
): SkillBranchType => ({ tags, levels });

/**
 * Builds a skill tree branch with one exercise per level, starting at level 1.
 *
 * generateTreeBranch(["e1", "e1x"], ["SIDE_BOTH"])
 * → { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e1x" } } }
 */
export const generateTreeBranch = (
  exerciseIds: string[],
  tags: string[] = [],
): SkillBranchType =>
  generateSkillBranch(
    tags,
    Object.fromEntries(
      exerciseIds.map((exerciseId, index) => [index + 1, { exerciseId }]),
    ),
  );

/**
 * Builds branches with the given tags, each with the same levels. The default
 * is one level with the exercise "1".
 *
 * generateTaggedBranches({ knee: ["PREVENTION_KNEE_HIP"] })
 * → { knee: { tags: ["PREVENTION_KNEE_HIP"], levels: { 1: { exerciseId: "1" } } } }
 * generateTaggedBranches({ 1: ["AGE_ADULT"] }, {})
 * → { 1: { tags: ["AGE_ADULT"], levels: {} } }
 */
export const generateTaggedBranches = (
  tagsById: Record<string, string[]>,
  levels: SkillBranchType["levels"] = { 1: { exerciseId: "1" } },
): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tagsById).map(([id, tags]) => [
      id,
      generateSkillBranch(tags, levels),
    ]),
  );

/**
 * Builds skill trees with a BAS branch blocked on knee pain and a MOB branch
 * without tags.
 *
 * generateKneeSkillTrees()
 * → { BAS: { "1": { tags: ["BLOCK_KNEE"], ... } }, MOB: { "2": { tags: [], ... } } }
 */
export const generateKneeSkillTrees = (): Record<string, SkillTreeType> => ({
  BAS: { "1": generateSkillBranch(["BLOCK_KNEE"]) },
  MOB: { "2": generateTreeBranch(["e2"]) },
});
