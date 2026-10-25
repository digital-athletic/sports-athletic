import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import type { GenerationInput } from "./generationInput";

// String keys and an optional exerciseId, so stored day entries pass straight in
export type CandidateLevels = Record<string, { exerciseId?: string }>;

/** A branch as the rule families read it: from a skill tree or a stored day. */
export interface CandidateBranch {
  tags?: string[];
  levels?: CandidateLevels;
  exercises?: CandidateLevels;
}

export type RuleFamilyName =
  | "pain"
  | "muscleSoreness"
  | "equipment"
  | "fitnessLevel"
  | "ageGroup"
  | "gender";

/** A branch a rule family removed, with the athlete or place values that removed it. */
export interface BranchRemoval {
  branchId: string;
  family: RuleFamilyName;
  details: string[];
}

export interface RuleFamilyResult<T extends CandidateBranch> {
  keep: Record<string, T>;
  removals: BranchRemoval[];
  /** The regions to refill, one per removed branch, in candidate order. */
  replace: string[];
}

export type RuleFamily = <T extends CandidateBranch>(
  branches: Record<string, T>,
  input: GenerationInput,
  skill: string,
) => RuleFamilyResult<T>;

/** Keeps the candidates the check accepts, in candidate order. */
export const keepBranches = <T extends CandidateBranch>(
  branches: Record<string, T>,
  isKept: (branch: T) => boolean,
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(branches).filter(([, branch]) => isKept(branch)),
  );

/** Lists the candidates a filter left out of its keep record, in candidate order. */
export const listBranchRemovals = (
  branches: Record<string, CandidateBranch>,
  keep: Record<string, CandidateBranch>,
  family: RuleFamilyName,
  readRemovalDetails: (branchId: string) => string[],
): BranchRemoval[] =>
  Object.keys(branches)
    .filter((branchId) => !Object.hasOwn(keep, branchId))
    .map((branchId) => ({
      branchId,
      family,
      details: readRemovalDetails(branchId),
    }));

/**
 * Reads the region a removed branch asks to refill: its first region tag, or
 * none for a branch without one.
 *
 * readReplacementRegion(["REGION_FULL_BODY", "REGION_LOWER_BODY"]) → ["FULL_BODY"]
 */
export const readReplacementRegion = (tags: string[] = []): string[] =>
  getTagValues(tags, TagGroups.REGION).slice(0, 1);
