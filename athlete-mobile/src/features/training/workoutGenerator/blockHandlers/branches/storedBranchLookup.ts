import type { Block } from "@/schemas/aiwl.schema";
import type { ExerciseBranchEntry } from "@/schemas/generator.schema";
import type { GenerationInput } from "../../generationInput/generationInput";
import type { CandidateBranch } from "../../ruleFamilies/ruleFamily";

/** A branch ID of a branches block with the branch the lookup found for it. */
export interface StoredBranch {
  branchId: string;
  branch: CandidateBranch;
}

/** The branch entries a stored training day keeps per skill. */
export type StoredDaySkills = Readonly<
  Record<string, readonly ExerciseBranchEntry[] | undefined>
>;

export type StoredBranchLookup = (
  skill: string,
  branchId: string,
  input: GenerationInput,
) => CandidateBranch | undefined;

/**
 * Reads a stored branch ID from the current catalog through the branch lookup
 * index. A branch without levels counts as not found, as plan creation never
 * stores one.
 */
export const lookUpStoredBranchInCatalog: StoredBranchLookup = (
  _skill,
  branchId,
  { branchLookupIndex },
) => {
  const indexedBranch = branchLookupIndex.get(branchId);
  return indexedBranch && Object.keys(indexedBranch.branch.levels).length > 0
    ? indexedBranch.branch
    : undefined;
};

/**
 * Reads a stored branch ID from the entries a stored training day saved at
 * plan creation. Training days use this lookup until the stored plan migration
 * (see the stored workouts section of the architecture ADR). A repeated ID
 * reads its last entry.
 */
export const createStoredDayBranchLookup =
  (skills: StoredDaySkills): StoredBranchLookup =>
  (skill, branchId) =>
    Object.hasOwn(skills, skill)
      ? skills[skill]?.findLast((entry) => entry.branchId === branchId)
      : undefined;

/** Lists the branches the lookup finds for a block, in stored order with repeats. */
export const listStoredBranches = (
  block: Extract<Block, { kind: "branches" }>,
  input: GenerationInput,
  lookUpStoredBranch: StoredBranchLookup,
): StoredBranch[] =>
  block.branches.flatMap((branchId) => {
    const branch = lookUpStoredBranch(block.skill, branchId, input);
    return branch ? [{ branchId, branch }] : [];
  });
