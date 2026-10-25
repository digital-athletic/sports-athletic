import { getAllSkillTrees } from "@/data/skillTreeRegistry";
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
 * Builds branches with the given tags and one level each, whose exercise ID
 * equals the branch ID.
 *
 * generateSelfNamedBranches({ a: ["SIDE_ONE"] })
 * → { a: { tags: ["SIDE_ONE"], levels: { 1: { exerciseId: "a" } } } }
 */
export const generateSelfNamedBranches = (
  tagsById: Record<string, string[]>,
): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tagsById).map(([id, tags]) => [
      id,
      generateTreeBranch([id], tags),
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

/**
 * Builds skill trees of one exercise per branch: MOB holds branches 1 and 2,
 * BR branch 3 and CD branch 4.
 *
 * generateMixedSkillTrees()
 * → { MOB: { "1": <e1>, "2": <e2> }, BR: { "3": <e3> }, CD: { "4": <e4> } }
 */
export const generateMixedSkillTrees = (): Record<string, SkillTreeType> => ({
  MOB: {
    "1": generateTreeBranch(["e1"]),
    "2": generateTreeBranch(["e2"]),
  },
  BR: { "3": generateTreeBranch(["e3"]) },
  CD: { "4": generateTreeBranch(["e4"]) },
});

/**
 * Builds a MOB tree that holds the branch as branch "500".
 *
 * generateMobilityTree(generateTreeBranch(["501"], ["SKILL_MOB"]))
 * → { MOB: { "500": { tags: ["SKILL_MOB"], levels: { 1: { exerciseId: "501" } } } } }
 */
export const generateMobilityTree = (
  branch: SkillBranchType,
): Record<string, SkillTreeType> => ({ MOB: { "500": branch } });

/**
 * Builds a lower body branch of the BAS tree with the given levels. The
 * branch is two sided unless the extra tags say otherwise.
 *
 * generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, ["SIDE_ONE"])
 * → { tags: ["SKILL_BAS", "REGION_LOWER_BODY", "SIDE_ONE"], levels: { 1: { exerciseId: "e1" } } }
 */
export const generateLowerBodyBranch = (
  levels: SkillBranchType["levels"],
  extraTags: string[] = ["SIDE_BOTH"],
): SkillBranchType =>
  generateSkillBranch(["SKILL_BAS", "REGION_LOWER_BODY", ...extraTags], levels);

/**
 * Builds a two sided upper body branch on exercise 431 with the given extra
 * tags.
 *
 * generateUpperBodyBranch(["EQ_TYPE_KG"])
 * → { tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_TYPE_KG"], levels: { 1: { exerciseId: "431" } } }
 */
export const generateUpperBodyBranch = (tags: string[]): SkillBranchType =>
  generateSkillBranch(["REGION_UPPER_BODY", "SIDE_BOTH", ...tags], {
    1: { exerciseId: "431" },
  });

/**
 * Builds one single-branch tree per tree name, numbered in name order.
 *
 * generateNamedSkillTrees()
 * → { BAS: { "1": { tags: ["SKILL_BAS"], ... } }, GKS: { "2": ... }, ..., CD: { "11": ... } }
 * The trees are BAS, GKS, GKSKG, SA, SAKG, SWR1, SWR1KG, PREV, PREVKG, MOB and CD.
 */
export const generateNamedSkillTrees = (): Record<string, SkillTreeType> =>
  Object.fromEntries(
    [
      "BAS",
      "GKS",
      "GKSKG",
      "SA",
      "SAKG",
      "SWR1",
      "SWR1KG",
      "PREV",
      "PREVKG",
      "MOB",
      "CD",
    ].map((name, index) => [
      name,
      { [index + 1]: generateSkillBranch([`SKILL_${name}`]) },
    ]),
  );

/**
 * Builds a prevention tree with two knee and three shoulder branches.
 *
 * generatePreventionTree()
 * → { "1": { tags: ["PREVENTION_KNEE", "REGION_LOWER_BODY"], ... }, "2": knee core,
 *     "3" to "5": shoulder upper body }
 */
export const generatePreventionTree = (): SkillTreeType => ({
  "1": generateSkillBranch(["PREVENTION_KNEE", "REGION_LOWER_BODY"]),
  "2": generateSkillBranch(["PREVENTION_KNEE", "REGION_CORE"]),
  "3": generateSkillBranch(["PREVENTION_SHOULDER", "REGION_UPPER_BODY"]),
  "4": generateSkillBranch(["PREVENTION_SHOULDER", "REGION_UPPER_BODY"]),
  "5": generateSkillBranch(["PREVENTION_SHOULDER", "REGION_UPPER_BODY"]),
});

/**
 * Copies the real skill trees with the breathing tree replaced by the first
 * two breathing branches, tagged with the given tags. Without tags no
 * equipment rule removes them; with BLOCK_KNEE knee pain empties the pool.
 *
 * generateBreathingTrees(["BLOCK_KNEE"]).BR
 * → { "990001": { tags: ["BLOCK_KNEE"], levels }, "990002": { ... } }
 */
export const generateBreathingTrees = (
  tags: string[],
): Record<string, SkillTreeType> => {
  const skillTrees = getAllSkillTrees();
  const [first, second] = Object.values(skillTrees.BR);
  return {
    ...skillTrees,
    BR: { "990001": { ...first, tags }, "990002": { ...second, tags } },
  };
};
