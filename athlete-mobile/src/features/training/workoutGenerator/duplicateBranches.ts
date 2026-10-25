import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import { resolveBranchExerciseId } from "./branchResolution";
import type { StoredBranch } from "./storedBranchLookup";
import type { WorkoutInput } from "./workoutSetup";

export interface DuplicateBranchSplit {
  /** The first holder of each exercise, in the given order. */
  unique: StoredBranch[];
  /** One region to refill per later branch that has a region tag. */
  duplicateRegions: string[];
}

/**
 * Splits the kept branches into the first holder of each exercise at the
 * athlete's level and the later branches that resolve to a held exercise. A
 * branch without a resolved exercise is never a duplicate.
 */
export const splitDuplicateBranches = (
  keptBranches: StoredBranch[],
  input: WorkoutInput,
): DuplicateBranchSplit => {
  const heldExerciseIds = new Set<string>();
  const unique: StoredBranch[] = [];
  const duplicateRegions: string[] = [];
  for (const stored of keptBranches) {
    const { branchId, branch } = stored;
    const exerciseId = resolveBranchExerciseId(
      { levels: branch.exercises ?? branch.levels ?? {}, tags: branch.tags },
      input.athleteLevel,
      input.exerciseData.branchData[branchId],
    );
    if (exerciseId !== null && heldExerciseIds.has(exerciseId)) {
      const [region] = getTagValues(branch.tags ?? [], TagGroups.REGION);
      if (region) duplicateRegions.push(region);
      continue;
    }
    if (exerciseId !== null) heldExerciseIds.add(exerciseId);
    unique.push(stored);
  }
  return { unique, duplicateRegions };
};

/**
 * Refills each region slot on its own, so a slot without a fitting branch
 * drops out while the other slots stay. Each slot sees the branches the block
 * holds and the ones earlier slots added.
 */
export const refillBranchSlots = (
  regions: string[],
  keptBranches: StoredBranch[],
  refillSlot: (
    usedBranchIds: string[],
    region: string,
  ) => StoredBranch | undefined,
): StoredBranch[] => {
  const added: StoredBranch[] = [];
  for (const region of regions) {
    const branch = refillSlot(
      [...keptBranches, ...added].map(({ branchId }) => branchId),
      region,
    );
    if (branch) added.push(branch);
  }
  return added;
};
