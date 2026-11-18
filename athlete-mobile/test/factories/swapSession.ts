import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";

/**
 * Builds a session entry of the skill SK and the set 1 of 1 unless given, e.g.
 * generateSessionEntry("10", "e10", "SK", [1, 2])
 * → { branchId: "10", exerciseId: "e10", skill: "SK", set: [1, 2], repetition: 8 }.
 */
export const generateSessionEntry = (
  branchId: string,
  exerciseId: string,
  skill = "SK",
  set: [number, number] = [1, 1],
): UserExerciseDataType => ({
  branchId,
  exerciseId,
  skill,
  set,
  repetition: 8,
});

/**
 * Lists the entries of one branch in order,
 * e.g. the entries of branch "98001" → [{ branchId: "98001", exerciseId: "114", ... }, ...].
 */
export const listEntriesOfBranch = (
  entries: readonly UserExerciseDataType[],
  branchId: string,
): UserExerciseDataType[] =>
  entries.filter((entry) => entry.branchId === branchId);

/**
 * Lists the exercise IDs of the entries of one branch in order,
 * e.g. the entries of branch "98003" → ["161", "161"].
 */
export const listExerciseIdsOfBranch = (
  entries: readonly UserExerciseDataType[],
  branchId: string,
): string[] =>
  listEntriesOfBranch(entries, branchId).map(({ exerciseId }) => exerciseId);

/**
 * Lists the set positions of the entries of one branch in order,
 * e.g. the entries of branch "98001" → [[1, 2], [2, 2]].
 */
export const listSetsOfBranch = (
  entries: readonly UserExerciseDataType[],
  branchId: string,
): UserExerciseDataType["set"][] =>
  listEntriesOfBranch(entries, branchId).map(({ set }) => set);
