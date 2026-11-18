import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";

interface UsedEntries {
  usedBranchIds: string[];
  usedExerciseIds: string[];
}

/** Lists each non-placeholder branch of the session once, in session order. */
export const listDistinctSessionBranchIds = (
  session: readonly UserExerciseDataType[],
): string[] => {
  const branchIds = session.flatMap(({ branchId }) =>
    branchId && !isPlaceholderBranch(branchId) ? [branchId] : [],
  );
  return [...new Set(branchIds)];
};

/** Lists the branches and exercises of the session outside the given branch. */
export const listUsedEntries = (
  session: readonly UserExerciseDataType[],
  branchId: string,
): UsedEntries => {
  const others = session.filter((entry) => entry.branchId !== branchId);
  return {
    usedBranchIds: others.flatMap((entry) =>
      entry.branchId ? [entry.branchId] : [],
    ),
    usedExerciseIds: others.map(({ exerciseId }) => exerciseId),
  };
};
