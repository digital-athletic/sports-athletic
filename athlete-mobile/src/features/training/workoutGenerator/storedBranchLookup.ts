import type { Block } from "@/schemas/aiwl.schema";
import type { ExerciseBranchEntry } from "@/schemas/generator.schema";
import type { GenerationInput } from "./generationInput";
import type { CandidateBranch } from "./ruleFamily";

/** A branch ID of a branches block with the branch the lookup found for it. */
export interface StoredBranch {
  branchId: string;
  branch: CandidateBranch;
}

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
 * plan creation, since the old generator generates from that snapshot and not
 * from the current catalog. A repeated ID reads its last entry, as a branch
 * record keyed by ID keeps the last write.
 */
export const createStoredDayBranchLookup =
  (
    skills: Readonly<
      Record<string, readonly ExerciseBranchEntry[] | undefined>
    >,
  ): StoredBranchLookup =>
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
