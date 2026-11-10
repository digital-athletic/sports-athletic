import { toUserExerciseData } from "@/schemas/generator.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import type { ExerciseBranchType } from "../models/ExerciseBranch";
import type { GeneratedSetListEntry } from "../models/SetListEntry";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import { getRaisedSubstituteLevel } from "../utils/substitutionLevelUtils";
import type { StoredTrainingDay } from "../workoutGenerator/storedDayWorkout";

/**
 * Returns a copy of the stored day whose skill holds the new branch in place
 * of the old one.
 */
export const swapBranchInStoredDay = (
  day: StoredTrainingDay,
  skill: string,
  branchId: string,
  branch: ExerciseBranchType,
): StoredTrainingDay => ({
  ...day,
  skills: {
    ...day.skills,
    [skill]: day.skills[skill]?.map((entry) =>
      entry.branchId === branchId ? branch : entry,
    ),
  },
});

/**
 * Applies the start level rule of branch substitution to a swapped in branch:
 * a stored level below the entry level rises to it. Without a stored level
 * resolution starts at the entry level anyway.
 */
export const raiseSwapStartLevel = (
  branchData: BranchDataMapType,
  branch: ExerciseBranchType,
  fitnessLevel: string,
): BranchDataMapType => {
  const raised = getRaisedSubstituteLevel(branch, branchData, fitnessLevel);
  return raised ? { ...branchData, [raised.branchId]: raised } : branchData;
};

/**
 * Replaces the session entries of a branch, in place and in order, with the
 * generated entries of the new branch. The session keeps its set positions.
 * Returns null when the generated entries do not match the session entries
 * one to one.
 */
export const replaceSessionBranch = (
  session: readonly UserExerciseDataType[],
  branchId: string,
  generated: readonly GeneratedSetListEntry[],
  newBranchId: string,
): UserExerciseDataType[] | null => {
  const replacements = generated.filter(
    (entry) => entry.branchId === newBranchId,
  );
  const oldCount = session.filter(
    (entry) => entry.branchId === branchId,
  ).length;
  if (replacements.length === 0 || replacements.length !== oldCount) {
    return null;
  }
  let next = 0;
  return session.map((entry) => {
    if (entry.branchId !== branchId) return entry;
    const replacement = toUserExerciseData(replacements[next++]);
    return { ...replacement, set: entry.set };
  });
};
