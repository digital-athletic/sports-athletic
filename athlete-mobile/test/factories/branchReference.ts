import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";

/**
 * Builds a two sided branch reference with the exercise ID `e<id>`, unless
 * the exercise ID is given.
 *
 * generateBranchReference("c", ["MUSCLE_CHEST"])
 * → { branchId: "c", exerciseId: "ec", branchTags: ["SIDE_BOTH", "MUSCLE_CHEST"] }
 */
export const generateBranchReference = (
  id: string,
  tags: string[] = [],
  exerciseId = `e${id}`,
): BranchExerciseReference => ({
  branchId: id,
  exerciseId,
  branchTags: ["SIDE_BOTH", ...tags],
});
