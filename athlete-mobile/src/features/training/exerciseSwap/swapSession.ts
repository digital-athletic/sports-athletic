import { toUserExerciseData } from "@/schemas/generator.schema";
import type { ExerciseBranchType } from "../models/ExerciseBranch";
import { isPlaceholderBranch } from "../models/IdTypes";
import type { GeneratedSetListEntry } from "../models/SetListEntry";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { StoredTrainingDay } from "../workoutGenerator/storedDayWorkout";
import type { ExerciseSwapState } from "./swapPlan";

/**
 * Returns a copy of the stored day with the new branch in place of the old one
 * under the skill.
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
 * Replaces the session entries of a branch, in place and in order, with the
 * given entries. Set positions are unchanged. Returns null when the entry
 * counts differ or no entries are given.
 */
export const replaceSessionBranch = (
  session: readonly UserExerciseDataType[],
  branchId: string,
  replacements: readonly UserExerciseDataType[],
): UserExerciseDataType[] | null => {
  const oldCount = session.filter(
    (entry) => entry.branchId === branchId,
  ).length;
  if (replacements.length === 0 || replacements.length !== oldCount) {
    return null;
  }
  let next = 0;
  return session.map((entry) =>
    entry.branchId === branchId
      ? { ...replacements[next++], set: entry.set }
      : entry,
  );
};

/** Whether an exercise of the branch also appears under another branch. */
export const holdsExerciseTwice = (
  session: readonly UserExerciseDataType[],
  branchId: string,
): boolean => {
  const otherExerciseIds = new Set(
    session
      .filter((entry) => entry.branchId !== branchId)
      .map(({ exerciseId }) => exerciseId),
  );
  return session.some(
    (entry) =>
      entry.branchId === branchId && otherExerciseIds.has(entry.exerciseId),
  );
};

export interface SwappableBranch {
  branchId: string;
  skill: UserExerciseDataType["skill"];
}

/**
 * The branches of a session a swap can address: each branch the plan day
 * stores under its skill, once. A branch under two skills drops out, as one
 * swap cannot keep both plan entries apart.
 */
export const listSwappableBranches = (
  session: readonly UserExerciseDataType[],
  day: StoredTrainingDay,
): SwappableBranch[] => {
  const skillsByBranch = new Map<string, Set<SwappableBranch["skill"]>>();
  for (const { branchId, skill } of session) {
    if (!branchId || isPlaceholderBranch(branchId)) continue;
    const skills = skillsByBranch.get(branchId) ?? new Set();
    skills.add(skill);
    skillsByBranch.set(branchId, skills);
  }
  return [...skillsByBranch].flatMap(([branchId, skills]) => {
    const [skill] = [...skills];
    const inPlan = day.skills[skill]?.some(
      (entry) => entry.branchId === branchId,
    );
    return skills.size === 1 && inPlan ? [{ branchId, skill }] : [];
  });
};

/** The branch an exercise shows at the position of its swap. */
export const branchIdAt = (swap: ExerciseSwapState, original: string) =>
  swap.position === 0
    ? original
    : swap.alternatives[swap.position - 1].branchId;

export interface SwapStepRequest {
  session: readonly UserExerciseDataType[];
  original: string;
  swap: ExerciseSwapState;
  /** Generates the training day with the alternative in the original's place. */
  generateWith: (alternative: StoredBranch) => GeneratedSetListEntry[];
}

const entriesAt = (
  { swap, original, generateWith }: SwapStepRequest,
  position: number,
): readonly UserExerciseDataType[] => {
  if (position === 0) return swap.originalEntries;
  const alternative = swap.alternatives[position - 1];
  return generateWith(alternative)
    .filter((entry) => entry.branchId === alternative.branchId)
    .map(toUserExerciseData);
};

/**
 * Walks the cycle to the next branch whose entries fit the session without
 * repeating a branch or an exercise already in the session. Position 0
 * restores the original entries, so a cycle without a fit ends there.
 */
export const findNextSwap = (
  request: SwapStepRequest,
): { session: UserExerciseDataType[]; position: number } | null => {
  const { session, original, swap } = request;
  const current = branchIdAt(swap, original);
  let position = swap.position;
  for (let tries = 0; tries <= swap.alternatives.length; tries++) {
    position = (position + 1) % (swap.alternatives.length + 1);
    const target = branchIdAt({ ...swap, position }, original);
    if (position > 0 && session.some((entry) => entry.branchId === target)) {
      continue;
    }
    const next = replaceSessionBranch(
      session,
      current,
      entriesAt(request, position),
    );
    if (next && !holdsExerciseTwice(next, target)) {
      return { session: next, position };
    }
  }
  return null;
};
