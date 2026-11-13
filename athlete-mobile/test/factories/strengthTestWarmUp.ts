import type { PicksBlock } from "@/schemas/aiwl.schema";
import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";
import { generateTreeBranch } from "./skillTree";

/**
 * Builds the picks block of the strength test warm-up as TEST.json authors
 * it: one lower body, one full body, one upper body and two draws of any
 * region, each counted by exercise, with any unused branch for an empty
 * region.
 *
 * generateStrengthTestWarmUpBlock()
 * → { kind: "picks", skill: "WU", picks: [{ tags: ["REGION_LOWER_BODY"], count: 1 }, ...,
 *     { tags: [], count: 2 }], countBy: "exercises", fallbackToWholeTree: true,
 *     sets: 1, superset: "none", setDuration: 60, rest: { ... } }
 */
export const generateStrengthTestWarmUpBlock = (
  overrides: Partial<PicksBlock> = {},
): PicksBlock => ({
  kind: "picks",
  skill: "WU",
  picks: [
    { tags: ["REGION_LOWER_BODY"], count: 1 },
    { tags: ["REGION_FULL_BODY"], count: 1 },
    { tags: ["REGION_UPPER_BODY"], count: 1 },
    { tags: [], count: 2 },
  ],
  countBy: "exercises",
  fallbackToWholeTree: true,
  sets: 1,
  superset: "none",
  setDuration: 60,
  rest: {
    withinSuperset: 10,
    betweenSets: 10,
    afterExercise: 10,
    afterBlock: 30,
  },
  ...overrides,
});

// Two sided unless the extra tags name a side.
const generateWarmUpBranch = (
  exerciseId: string,
  region: string,
  extraTags: readonly string[],
): SkillBranchType =>
  generateTreeBranch(
    [exerciseId],
    [
      "SKILL_WU",
      `REGION_${region}`,
      ...(extraTags.some((tag) => tag.startsWith("SIDE_"))
        ? []
        : ["SIDE_BOTH"]),
      ...extraTags,
    ],
  );

/**
 * Builds a warm-up tree of six real warm-up exercises: one lower body, one
 * full body, one upper body and three core branches, each of one level and
 * tagged with the extra tags. Every branch ID names its region.
 *
 * generateRegionWarmUpTree(["SIDE_ONE"])
 * → { lower: { tags: ["SKILL_WU", "REGION_LOWER_BODY", "SIDE_ONE"], levels: { 1: { exerciseId: "432" } } },
 *     full: <493>, upper: <1112>, core1: <421>, core2: <400>, core3: <491> }
 */
export const generateRegionWarmUpTree = (
  extraTags: readonly string[] = [],
): SkillTreeType => ({
  lower: generateWarmUpBranch("432", "LOWER_BODY", extraTags),
  full: generateWarmUpBranch("493", "FULL_BODY", extraTags),
  upper: generateWarmUpBranch("1112", "UPPER_BODY", extraTags),
  core1: generateWarmUpBranch("421", "CORE", extraTags),
  core2: generateWarmUpBranch("400", "CORE", extraTags),
  core3: generateWarmUpBranch("491", "CORE", extraTags),
});
