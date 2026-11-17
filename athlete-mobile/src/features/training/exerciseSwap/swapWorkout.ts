import { isGeneratorError } from "@/features/training/models/GeneratorError";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  createStoredDayBranchLookup,
  lookUpStoredBranchInCatalog,
  type StoredBranch,
  type StoredBranchLookup,
} from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { BranchesBlock } from "@/features/training/workoutGenerator/stages/blockWalk";
import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import {
  isAiwlTrainingDay,
  type TrainingDay,
} from "@/features/training/workoutGenerator/trainingDayWorkout";
import {
  resolveWorkoutFilters,
  type WorkoutFilters,
} from "@/features/training/workoutGenerator/workoutFilters";
import { generateSetList } from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import { toUserExerciseData } from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import {
  buildSkillBranchesBlock,
  findSkillBlock,
  setUpShortWorkout,
} from "./swapBlock";
import {
  listPickSwapAlternatives,
  listSwapAlternatives,
} from "./swapAlternatives";

/** Where the blocks of a swap workout come from: a plan day or a short workout template. */
export type SwapWorkoutSource =
  | { kind: "plan"; day: TrainingDay }
  | { kind: "short"; template: Template };

/** The session the athlete sees, plus what the swap needs to generate one block of it. */
export interface SwapWorkout {
  session: readonly UserExerciseDataType[];
  source: SwapWorkoutSource;
  input: GenerationInput;
  skillTrees: Readonly<Record<string, SkillTreeType>>;
}

interface UsedEntries {
  usedBranchIds: string[];
  usedExerciseIds: string[];
}

interface SwapRequest {
  skill: string;
  target: string;
  replacement: StoredBranch;
}

// A generator error is a plain object; its params can name pains, so only its type is logged.
export const logSwapError = (e: unknown): void => {
  if (e instanceof Error) {
    Logger.logError(e);
    return;
  }
  const reason = isGeneratorError(e) ? `${e.type}/${e.subtype}` : "unknown";
  Logger.logError(new Error(`Exercise swap failed: ${reason}`));
};

/** Finds the skill of the branch, or null when the session trains the branch under no skill or two. */
const findBranchSkill = (
  session: readonly UserExerciseDataType[],
  branchId: string,
): string | null => {
  if (isPlaceholderBranch(branchId)) return null;
  const skills = new Set(
    session
      .filter((entry) => entry.branchId === branchId)
      .map(({ skill }) => skill),
  );
  if (skills.size !== 1) return null;
  const [skill] = [...skills];
  return skill;
};

const listUsedEntries = (
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

/**
 * The branch lookup of the source. A legacy day reads its saved copies, then
 * the catalog, so a replacement shown after an earlier swap resolves.
 */
const readSourceBranchLookup = (
  source: SwapWorkoutSource,
): StoredBranchLookup => {
  if (source.kind === "short" || isAiwlTrainingDay(source.day)) {
    return lookUpStoredBranchInCatalog;
  }
  const lookUpSavedBranch = createStoredDayBranchLookup(source.day.skills);
  return (skill, branchId, input) =>
    lookUpSavedBranch(skill, branchId, input) ??
    lookUpStoredBranchInCatalog(skill, branchId, input);
};

const createSwapBranchLookup = (
  source: SwapWorkoutSource,
  replacement: StoredBranch,
): StoredBranchLookup => {
  const lookUpSourceBranch = readSourceBranchLookup(source);
  return (skill, branchId, input) =>
    branchId === replacement.branchId
      ? replacement.branch
      : lookUpSourceBranch(skill, branchId, input);
};

// Matches the router: a plan day passes no filters, so every filter applies.
// A short workout ignores muscle soreness.
const readSourceFilters = (
  source: SwapWorkoutSource,
): Partial<WorkoutFilters> | undefined =>
  source.kind === "short" ? SHORT_WORKOUT_FILTERS : undefined;

/**
 * Generates the entries of the replacement in the one block of the skill.
 * Null when the skill has no block to swap in or the generator throws.
 */
const generateReplacementEntries = (
  workout: SwapWorkout,
  { skill, target, replacement }: SwapRequest,
): UserExerciseDataType[] | null => {
  try {
    const block = buildSkillBranchesBlock(workout, skill);
    if (block === null) return null;
    const swappedBlock: BranchesBlock = {
      ...block,
      branches: block.branches.map((branchId) =>
        branchId === target ? replacement.branchId : branchId,
      ),
    };
    const setList = generateSetList(
      { id: "EXERCISE_SWAP", blocks: [swappedBlock] },
      createSwapBranchLookup(workout.source, replacement),
      workout.input,
      {
        skillTrees: workout.skillTrees,
        filters: readSourceFilters(workout.source),
      },
    );
    return setList
      .filter((entry) => entry.branchId === replacement.branchId)
      .map(toUserExerciseData);
  } catch (e) {
    logSwapError(e);
    return null;
  }
};

const listSkillReplacements = (
  workout: SwapWorkout,
  skill: string,
  target: string,
): StoredBranch[] => {
  const block = findSkillBlock(workout.source, skill);
  if (block === null) return [];
  const used = listUsedEntries(workout.session, target);
  if (workout.source.kind === "plan") {
    const planInput = setUpWorkout(workout.input, resolveWorkoutFilters());
    return listSwapAlternatives(
      { skill, branchId: target, ...used },
      planInput,
    );
  }
  const shortInput = setUpShortWorkout(workout, workout.source.template);
  if (block.kind === "picks") {
    return listPickSwapAlternatives(
      { branchId: target, ...used },
      block,
      shortInput,
    );
  }
  return listSwapAlternatives({ skill, branchId: target, ...used }, shortInput);
};

/** Up to three branches that may replace the target, closest first. */
export const getBranchReplacement = (
  workout: SwapWorkout,
  target: string,
): StoredBranch[] => {
  const skill = findBranchSkill(workout.session, target);
  if (skill === null) return [];
  try {
    return listSkillReplacements(workout, skill, target);
  } catch (e) {
    logSwapError(e);
    return [];
  }
};

/** The session with the replacement's entries at the target's set positions, or null. */
export const swapBranchFromWorkout = (
  workout: SwapWorkout,
  target: string,
  replacement: StoredBranch,
): UserExerciseDataType[] | null => {
  const { session } = workout;
  const skill = findBranchSkill(session, target);
  if (skill === null) return null;
  if (session.some((entry) => entry.branchId === replacement.branchId)) {
    return null;
  }
  const entries = generateReplacementEntries(workout, {
    skill,
    target,
    replacement,
  });
  if (entries === null) return null;
  const swapped = replaceSessionBranch(session, target, entries);
  if (swapped === null) return null;
  return holdsExerciseTwice(swapped, replacement.branchId) ? null : swapped;
};

/** The session with the original entries back in place of the shown branch, or null. */
export const restoreBranchEntries = (
  session: readonly UserExerciseDataType[],
  shown: string,
  originalEntries: readonly UserExerciseDataType[],
): UserExerciseDataType[] | null =>
  replaceSessionBranch(session, shown, originalEntries);
