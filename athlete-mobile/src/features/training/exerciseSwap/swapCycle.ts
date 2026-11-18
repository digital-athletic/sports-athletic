import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { StoredBranch } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import {
  listDistinctSessionBranchIds,
  replaceSessionBranch,
} from "./swapEntries";
import {
  listBranchAlternatives,
  swapBranchFromWorkout,
  type SwapWorkout,
} from "./swapWorkout";

/** The swap cycle of one original branch. */
export interface BranchSwap {
  alternatives: readonly StoredBranch[];
  /** 0 is the original branch, 1 to n the alternatives. */
  position: number;
  /** The session entries of the original branch, restored at position 0. */
  originalEntries: readonly UserExerciseDataType[];
}

/** The session after one swap step and the cycle position it shows. */
interface SwapStep {
  session: UserExerciseDataType[];
  position: number;
}

const MAX_SWAP_ALTERNATIVES = 3;

/** Lists the first three ranked alternatives whose swap builds a session. */
const listBuildableAlternatives = (
  workout: SwapWorkout,
  branchId: string,
): StoredBranch[] => {
  const buildable: StoredBranch[] = [];
  for (const candidate of listBranchAlternatives(workout, branchId)) {
    if (buildable.length === MAX_SWAP_ALTERNATIVES) break;
    if (swapBranchFromWorkout(workout, branchId, candidate) !== null) {
      buildable.push(candidate);
    }
  }
  return buildable;
};

/** Builds one swap cycle per session branch with at least one alternative. */
export const listBranchSwaps = (
  workout: SwapWorkout,
): Record<string, BranchSwap> => {
  const swaps: Record<string, BranchSwap> = {};
  for (const branchId of listDistinctSessionBranchIds(workout.session)) {
    const alternatives = listBuildableAlternatives(workout, branchId);
    if (alternatives.length === 0) continue;
    swaps[branchId] = {
      alternatives,
      position: 0,
      originalEntries: workout.session.filter(
        (entry) => entry.branchId === branchId,
      ),
    };
  }
  return swaps;
};

/** The branch that an exercise shows at the current position of its swap. */
export const branchIdAt = (swap: BranchSwap, original: string): string =>
  swap.position === 0
    ? original
    : swap.alternatives[swap.position - 1].branchId;

/** The original branch whose swap shows the given branch. */
export const findOriginalBranchId = (
  swaps: Record<string, BranchSwap>,
  branchId: string,
): string | undefined =>
  Object.keys(swaps).find(
    (original) => branchIdAt(swaps[original], original) === branchId,
  );

/**
 * Walks the cycle forward from the shown branch to the first position whose
 * entries fit the session. Position 0 restores the original entries.
 */
export const findNextStep = (
  workout: SwapWorkout,
  original: string,
  swap: BranchSwap,
): SwapStep | null => {
  const shown = branchIdAt(swap, original);
  const cycleLength = swap.alternatives.length + 1;
  for (let step = 1; step < cycleLength; step += 1) {
    const position = (swap.position + step) % cycleLength;
    const session =
      position === 0
        ? replaceSessionBranch(workout.session, shown, swap.originalEntries)
        : swapBranchFromWorkout(
            workout,
            shown,
            swap.alternatives[position - 1],
          );
    if (session !== null) return { session, position };
  }
  return null;
};
