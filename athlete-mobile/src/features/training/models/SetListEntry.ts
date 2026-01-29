import type { GeneratorSkillTypeFromSchema } from "@/schemas/generator.schema";

export type SetListEntryType = {
  exerciseId: string;
  set: [number, number];
  /** Duration in seconds for timed exercises */
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
  /** Duration in seconds for timed exercises */
  duration?: number;
  repetition?: number;
  weight?: number;
  height?: number;
  weightType?: string;
  /** Branch tags - used during MAX training generation */
  tags?: string[];
  /** Max force repetition data - used during MAX training generation */
  repetitionMAX?: { level: string; repetitions: number };
};
