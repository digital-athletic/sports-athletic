import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { BlockHandlerRegistry, BlockResult } from "./blockWalk";
import { resolveBranchExercise } from "./branchResolution";
import { applyBranchesRuleChain } from "./branchesRuleChain";
import {
  listStoredBranches,
  type StoredBranch,
  type StoredBranchLookup,
} from "./storedBranchLookup";
import type { WorkoutInput } from "./workoutSetup";

/**
 * Resolves each branch to its exercise at the athlete level or the athlete's
 * branch level. A branch without an exercise keeps its slot with exercise ID
 * "-1", which the set list builder drops.
 */
const resolveBranchExercises = (
  branches: StoredBranch[],
  input: WorkoutInput,
): BranchExerciseReference[] =>
  branches.map(({ branchId, branch }) => {
    const tags = branch.tags ?? [];
    // A stored day entry names its exercises under `exercises`, a catalog
    // branch under `levels`; the catalog lookup needs the second.
    const exercise = resolveBranchExercise(
      { levels: branch.exercises ?? branch.levels ?? {}, tags },
      input.athleteLevel,
      input.exerciseCatalog,
      input.exerciseData.branchData[branchId] ?? null,
    );
    return {
      branchId,
      branchTags: exercise ? exercise.tags : tags,
      exerciseId: exercise?.id ?? "-1",
    };
  });

/**
 * Builds the branches handler of a training day. The lookup reads the stored
 * branch IDs: the branch lookup index, or the entries a stored training day
 * saved at plan creation. No default, so a caller always picks one.
 */
export const createBranchesBlockHandler = (
  lookUpStoredBranch: StoredBranchLookup,
): BlockHandlerRegistry["branches"] => ({
  usedBranchScope: "block",
  handleBlock: (block, input): BlockResult => {
    const storedBranches = listStoredBranches(block, input, lookUpStoredBranch);
    const chain = applyBranchesRuleChain(storedBranches, input, block.skill);
    const keptBranches = Object.entries(chain.keep).map(
      ([branchId, branch]) => ({ branchId, branch }),
    );
    // Without a region request the block keeps every stored branch, since the
    // old generator never writes the filtered list back on that path.
    // Replacement and the cardio, prevention, special warm-up and duplicate
    // exercise rules change the kept branches here.
    const keepsStoredBranches =
      keptBranches.length > 0 && chain.replace.length === 0;
    const exercises = resolveBranchExercises(
      keepsStoredBranches ? storedBranches : keptBranches,
      input,
    );
    return exercises.length > 0
      ? {
          status: "filled",
          block,
          exercises,
          usedBranchIds: [
            ...new Set(exercises.map(({ branchId }) => branchId)),
          ],
        }
      : {
          status: "empty",
          block,
          reason: chain.emptyReason,
          usedBranchIds: [],
        };
  },
});
