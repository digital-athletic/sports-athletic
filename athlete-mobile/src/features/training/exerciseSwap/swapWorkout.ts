import { isGeneratorError } from "@/features/training/models/GeneratorError";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { StoredBranch } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import {
  createSetListBlock,
  readBlockTiming,
} from "@/features/training/workoutGenerator/setListBuilders/setListBlockResolution";
import type { InterpretedWorkout } from "@/features/training/workoutGenerator/stages/blockWalk";
import {
  setUpWorkout,
  type WorkoutInput,
} from "@/features/training/workoutGenerator/stages/workoutSetup";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { resolveWorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import type { WorkoutSelection } from "@/features/training/workoutGeneratorRouter";
import type { BranchSelectingBlock } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import {
  listPickSwapAlternatives,
  listSwapAlternatives,
} from "./swapAlternatives";
import {
  buildAlternativeEntries,
  listUsedEntries,
  replaceSessionBranch,
} from "./swapEntries";

/** The session the athlete sees, the workout that drew it and the set-up input of that workout. */
export interface SwapWorkout {
  session: readonly UserExerciseDataType[];
  workout: InterpretedWorkout;
  input: WorkoutInput;
}

/** Sets the selected workout up once for the swaps of one overview. */
export const setUpSwapWorkout = (
  { workout, filters }: Pick<WorkoutSelection, "workout" | "filters">,
  input: GenerationInput,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): Omit<SwapWorkout, "session"> => ({
  workout,
  input: setUpWorkout(
    input,
    resolveWorkoutFilters(filters),
    workout,
    skillTrees,
  ),
});

// A generator error is a plain object; its params can name pains, so only its type is logged.
export const logSwapError = (e: unknown): void => {
  if (e instanceof Error) {
    Logger.logError(e);
    return;
  }
  const reason = isGeneratorError(e) ? `${e.type}/${e.subtype}` : "unknown";
  Logger.logError(new Error(`Exercise swap failed: ${reason}`));
};

/**
 * Finds the one block of the skill that trains the branch in the session.
 * Returns null for a placeholder branch, a missing branch, a branch under two
 * or more skills, a skill without exactly one block, and an exercises block.
 */
const findBranchBlock = (
  { session, workout }: SwapWorkout,
  branchId: string,
): BranchSelectingBlock | null => {
  if (isPlaceholderBranch(branchId)) return null;
  const skills = new Set(
    session
      .filter((entry) => entry.branchId === branchId)
      .map(({ skill }) => skill),
  );
  if (skills.size !== 1) return null;
  const [skill] = [...skills];
  // The session cannot tell which of two blocks of one skill drew a branch.
  const blocks = workout.blocks.filter((block) => block.skill === skill);
  if (blocks.length !== 1) return null;
  const [block] = blocks;
  return block.kind === "exercises" ? null : block;
};

/** The entries of the alternative, or null when the build throws. */
const buildSwapEntries = (
  { session, input }: SwapWorkout,
  block: BranchSelectingBlock,
  target: string,
  alternative: StoredBranch,
): UserExerciseDataType[] | null => {
  try {
    return buildAlternativeEntries({
      session,
      input,
      block: createSetListBlock(block, readBlockTiming(block, input)),
      target,
      alternative,
    });
  } catch (e) {
    logSwapError(e);
    return null;
  }
};

/** Lists every ranked alternative for the target, closest first. */
export const listBranchAlternatives = (
  workout: SwapWorkout,
  target: string,
): StoredBranch[] => {
  const block = findBranchBlock(workout, target);
  if (block === null) return [];
  const request = {
    skill: block.skill,
    branchId: target,
    ...listUsedEntries(workout.session, target),
  };
  try {
    if (block.kind === "picks") {
      return listPickSwapAlternatives(request, block, workout.input);
    }
    return listSwapAlternatives(request, workout.input);
  } catch (e) {
    logSwapError(e);
    return [];
  }
};

/** The session with the alternative's entries at the target's set positions, or null. */
export const swapBranchFromWorkout = (
  workout: SwapWorkout,
  target: string,
  alternative: StoredBranch,
): UserExerciseDataType[] | null => {
  const { session } = workout;
  const block = findBranchBlock(workout, target);
  if (block === null) return null;
  if (session.some((entry) => entry.branchId === alternative.branchId)) {
    return null;
  }
  const entries = buildSwapEntries(workout, block, target, alternative);
  if (entries === null) return null;
  return replaceSessionBranch(session, target, entries);
};
