import type { PicksBlock } from "@/schemas/aiwl.schema";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { generateTreeBranch } from "./skillTree";

/**
 * Builds the picks block of the strength test warm-up: one lower body, one
 * full body, one upper body and two draws of any region.
 *
 * generateStrengthTestWarmUpBlock()
 * → { kind: "picks", skill: "WU", picks: [{ tags: ["LOWER_BODY"], count: 1 }, ...,
 *     { tags: [], count: 2 }], sets: 1, superset: "none", setDuration: 60, rest: { ... } }
 */
export const generateStrengthTestWarmUpBlock = (
  overrides: Partial<PicksBlock> = {},
): PicksBlock => ({
  kind: "picks",
  skill: "WU",
  picks: [
    { tags: ["LOWER_BODY"], count: 1 },
    { tags: ["FULL_BODY"], count: 1 },
    { tags: ["UPPER_BODY"], count: 1 },
    { tags: [], count: 2 },
  ],
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

/**
 * Builds a warm-up branch of one level with the exercise, two sided, tagged
 * with the extra tags.
 *
 * generateWarmUpBranch("a", ["REGION_LOWER_BODY"])
 * → { tags: ["SKILL_WU", "SIDE_BOTH", "REGION_LOWER_BODY"], levels: { 1: { exerciseId: "a" } } }
 */
export const generateWarmUpBranch = (
  exerciseId: string,
  extraTags: string[] = [],
): SkillBranchType =>
  generateTreeBranch([exerciseId], ["SKILL_WU", "SIDE_BOTH", ...extraTags]);
