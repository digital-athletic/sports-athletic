import type { StoredBranch } from "@/features/training/workoutGenerator/storedBranchLookup";
import type { CandidateBranch } from "@/features/training/workoutGenerator/ruleFamily";
import type { ExerciseBranchEntry } from "@/schemas/generator.schema";

/**
 * Builds a stored branch whose level 2 trains the exercise. The overrides
 * replace any field of the branch, for example to drop the exercises.
 *
 * generateStoredBranch("7", ["REGION_CORE"], "336")
 * → { branchId: "7", branch: { tags: ["REGION_CORE"], exercises: { "2": { exerciseId: "336" } } } }
 */
export const generateStoredBranch = (
  branchId: string,
  tags: string[] = [],
  exerciseId = "10",
  overrides: CandidateBranch = {},
): StoredBranch => ({
  branchId,
  branch: { tags, exercises: { "2": { exerciseId } }, ...overrides },
});

/**
 * Builds the entry a stored training day keeps for a branch: the stored
 * branch with its ID on the entry. The overrides replace any field of the
 * entry, for example to drop the branch ID.
 *
 * generateStoredDayEntry("1", ["REGION_UPPER_BODY"], "336")
 * → { branchId: "1", tags: ["REGION_UPPER_BODY"], exercises: { "2": { exerciseId: "336" } } }
 */
export const generateStoredDayEntry = (
  branchId: string,
  tags: string[] = [],
  exerciseId = "10",
  overrides: ExerciseBranchEntry = {},
): ExerciseBranchEntry => ({
  branchId,
  ...generateStoredBranch(branchId, tags, exerciseId).branch,
  ...overrides,
});
