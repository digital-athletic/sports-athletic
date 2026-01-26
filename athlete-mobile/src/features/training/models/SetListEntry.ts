import type { GeneratorSkillTypeFromSchema } from "@/schemas/generator.schema";

export type SetListEntryType = {
  exerciseId: string;
  set: [number, number];
  duration?: number;
  height?: number;
  repetition?: number;
  weight?: number;
};

/**
 * Extended set list entry with branch and skill information.
 * Used during training generation to track the full context of each exercise set.
 *
 * Note: branchId of "-1" indicates a placeholder/pause entry, not a real branch.
 * Use PLACEHOLDER_BRANCH_ID constant from IdTypes.ts for consistency.
 */
export type GeneratedSetListEntry = {
  branchId: string;
  exerciseId: string;
  /** Tuple of [currentSet, totalSets] */
  set: [number, number];
  /** Skill identifier - uses GeneratorSkillTypeFromSchema for type safety */
  skill: GeneratorSkillTypeFromSchema;
  duration?: number;
  repetition?: number;
  weight?: number;
  height?: number;
  weightType?: string;
};
