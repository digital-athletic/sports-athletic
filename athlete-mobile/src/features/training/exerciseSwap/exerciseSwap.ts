import { toUserExerciseData } from "@/schemas/generator.schema";
import type { ExerciseBranchType } from "../models/ExerciseBranch";
import { isPlaceholderBranch } from "../models/IdTypes";
import type { GeneratedSetListEntry } from "../models/SetListEntry";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { StoredTrainingDay } from "../workoutGenerator/storedDayWorkout";
import {
  isAiwlTrainingDay,
  type TrainingDay,
} from "../workoutGenerator/trainingDayGeneration";

export interface ExerciseSwapState {
  skill: string;
  /** 0 is the original branch, 1 to n the alternatives. */
  position: number;
  alternatives: readonly StoredBranch[];
  /** The session entries of the original branch, restored at position 0. */
  originalEntries: readonly UserExerciseDataType[];
}

/** Writes a catalog branch in the form the training plan stores. */
export const toExerciseBranch = ({
  branchId,
  branch,
}: StoredBranch): ExerciseBranchType => ({
  branchId,
  tags: branch.tags ?? [],
  exercises: Object.fromEntries(
    Object.entries(branch.levels ?? branch.exercises ?? {}).flatMap(
      ([level, { exerciseId }]) =>
        exerciseId ? [[Number(level), { exerciseId }]] : [],
    ),
  ),
});

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
 * Returns a copy of the training day with the alternative in place of the
 * branch under the skill. An old training stores the alternative as a copied
 * branch, an AIWL training stores its branch ID in every block of the skill.
 */
export const swapBranchInTrainingDay = (
  day: TrainingDay,
  skill: string,
  branchId: string,
  alternative: StoredBranch,
): TrainingDay =>
  isAiwlTrainingDay(day)
    ? {
        ...day,
        blocks: day.blocks.map((block) =>
          block.kind === "branches" && block.skill === skill
            ? {
                ...block,
                branches: block.branches.map((planned) =>
                  planned === branchId ? alternative.branchId : planned,
                ),
              }
            : block,
        ),
      }
    : swapBranchInStoredDay(
        day,
        skill,
        branchId,
        toExerciseBranch(alternative),
      );

/** The branch IDs a training day plans under the skill. */
const listPlannedBranchIds = (day: TrainingDay, skill: string): string[] =>
  isAiwlTrainingDay(day)
    ? day.blocks.flatMap((block) =>
        block.kind === "branches" && block.skill === skill
          ? block.branches
          : [],
      )
    : (day.skills[skill] ?? []).flatMap(({ branchId }) =>
        branchId ? [branchId] : [],
      );

/**
 * Replaces the session entries of a branch, in place and in order, with the
 * given entries. Set positions are unchanged. Returns null when the entry
 * counts differ or no entries are given.
 */
const replaceSessionBranch = (
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
const holdsExerciseTwice = (
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

interface SwappableBranch {
  branchId: string;
  skill: UserExerciseDataType["skill"];
}

/**
 * The swappable branches of a session: every branch that the plan day stores
 * under exactly one skill. A branch under two skills drops out, because one
 * swap cannot tell its two plan entries apart.
 */
export const listSwappableBranches = (
  session: readonly UserExerciseDataType[],
  day: TrainingDay,
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
    const inPlan = listPlannedBranchIds(day, skill).includes(branchId);
    return skills.size === 1 && inPlan ? [{ branchId, skill }] : [];
  });
};

/** The branch an exercise shows at the position of its swap. */
export const branchIdAt = (swap: ExerciseSwapState, original: string) =>
  swap.position === 0
    ? original
    : swap.alternatives[swap.position - 1].branchId;

interface SwapStepRequest {
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
