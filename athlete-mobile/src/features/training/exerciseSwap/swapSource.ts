import type { TrainingType } from "@/features/training/models/Training";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  lookUpStoredBranchInCatalog,
  type StoredBranch,
} from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import {
  generateTrainingDaySetList,
  isAiwlTrainingDay,
  type TrainingDay,
} from "@/features/training/workoutGenerator/trainingDayWorkout";
import { resolveWorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import { generateSetList } from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import { Logger } from "@/services/Logger";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  type ExerciseSwapState,
  listSwappableBranches,
  swapBranchInTrainingDay,
} from "./exerciseSwap";
import { freezeShortWorkout } from "./shortWorkoutSwap";
import {
  listPickSwapAlternatives,
  listSwapAlternatives,
} from "./swapAlternatives";

/** The strength test has no swap; a plan workout needs a training plan. */
export const supportsExerciseSwap = (
  type: TrainingType,
  hasTrainingPlan: boolean,
): boolean => {
  if (type === "PLAN") return hasTrainingPlan;
  return type !== "TEST_WORKOUT";
};

export interface SwapSource {
  /** One swap state per swappable branch with one or more alternatives, keyed by original branch ID, position 0. */
  swaps: Record<string, ExerciseSwapState>;
  /** The set list of the workout with the alternative in place of the original. */
  generateSwapped: (
    skill: string,
    original: string,
    alternative: StoredBranch,
  ) => GeneratedSetListEntry[];
}

interface UsedEntries {
  usedBranchIds: string[];
  usedExerciseIds: string[];
}

type ListAlternatives = (
  branch: { branchId: string; skill: string },
  used: UsedEntries,
) => StoredBranch[];

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

const listSwaps = (
  session: readonly UserExerciseDataType[],
  swappable: readonly { branchId: string; skill: string }[],
  listAlternatives: ListAlternatives,
): Record<string, ExerciseSwapState> => {
  const swaps: Record<string, ExerciseSwapState> = {};
  for (const branch of swappable) {
    const { branchId, skill } = branch;
    try {
      const alternatives = listAlternatives(
        branch,
        listUsedEntries(session, branchId),
      );
      if (alternatives.length === 0) continue;
      swaps[branchId] = {
        skill,
        position: 0,
        alternatives,
        originalEntries: session.filter((entry) => entry.branchId === branchId),
      };
    } catch (e) {
      // In a plan workout, muscle soreness in two regions makes the listing
      // throw. That exercise gets no swap button.
      if (e instanceof Error) Logger.logError(e);
    }
  }
  return swaps;
};

/** Swaps the branches of a plan training day within the day. */
export const createPlanSwapSource = (
  day: TrainingDay,
  input: GenerationInput,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
  session: readonly UserExerciseDataType[],
): SwapSource => {
  // A plan day applies every filter, so its alternatives do too.
  const workoutInput = setUpWorkout(input, resolveWorkoutFilters());
  return {
    swaps: listSwaps(
      session,
      listSwappableBranches(session, day),
      ({ branchId, skill }, used) =>
        listSwapAlternatives({ skill, branchId, ...used }, workoutInput),
    ),
    generateSwapped: (skill, original, alternative) =>
      generateTrainingDaySetList(
        swapBranchInTrainingDay(day, skill, original, alternative),
        input,
        skillTrees,
      ),
  };
};

const generateShortWorkout = (
  day: TrainingDay,
  input: GenerationInput,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): GeneratedSetListEntry[] => {
  if (!isAiwlTrainingDay(day)) {
    throw new Error("A frozen short workout stays an AIWL template");
  }
  return generateSetList(day, lookUpStoredBranchInCatalog, input, {
    skillTrees,
    filters: SHORT_WORKOUT_FILTERS,
  });
};

/**
 * Swaps the branches of a drawn short workout. The workout is frozen into a
 * template of the branches the session drew, and the picks of the original
 * template limit the alternatives.
 */
export const createShortWorkoutSwapSource = (
  template: Template,
  input: GenerationInput,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
  session: readonly UserExerciseDataType[],
): SwapSource => {
  const frozen = freezeShortWorkout(template, session);
  const workoutInput = setUpWorkout(
    input,
    resolveWorkoutFilters(SHORT_WORKOUT_FILTERS),
    template,
    skillTrees,
  );
  const listAlternatives: ListAlternatives = ({ branchId, skill }, used) => {
    const block = template.blocks.find(
      (candidate) => candidate.skill === skill,
    );
    if (block?.kind === "picks") {
      return listPickSwapAlternatives(
        { branchId, ...used },
        block,
        workoutInput,
      );
    }
    if (block?.kind === "branches") {
      return listSwapAlternatives({ skill, branchId, ...used }, workoutInput);
    }
    return [];
  };
  return {
    swaps: listSwaps(
      session,
      listSwappableBranches(session, frozen),
      listAlternatives,
    ),
    generateSwapped: (skill, original, alternative) =>
      generateShortWorkout(
        swapBranchInTrainingDay(frozen, skill, original, alternative),
        input,
        skillTrees,
      ),
  };
};
