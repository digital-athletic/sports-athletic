import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { SELECTIONS_BLOCK_HANDLER } from "@/features/training/workoutGenerator/blockHandlers/selections/selectionsHandler";

/**
 * Spies on the selections handler and returns a reader for the branches it drew.
 * The reader gives the branches of the first block of the given skill, else
 * of the first block, and an empty list for a block that came out empty.
 * Specs restore the spy with `afterEach(jest.restoreAllMocks)`.
 *
 * const readDrawnBranches = spyOnDrawnBranches();
 * generator.generateShortWorkout("MOB", ...);
 * readDrawnBranches("MOB") → [{ branchId: "500", branchTags: [...], exerciseId: "501" }]
 */
export const spyOnDrawnBranches = (): ((
  skill?: string,
) => BranchExerciseReference[]) => {
  const handleBlock = jest.spyOn(SELECTIONS_BLOCK_HANDLER, "handleBlock");
  return (skill) => {
    const results = handleBlock.mock.results.flatMap((entry) =>
      entry.type === "return" ? [entry.value] : [],
    );
    const result =
      results.find((candidate) => candidate.block.skill === skill) ??
      results.at(0);
    if (result === undefined) {
      throw new Error("The selections handler drew no block");
    }
    return result.status === "filled" ? result.exercises : [];
  };
};
