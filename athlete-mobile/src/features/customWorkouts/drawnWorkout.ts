import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { DrawnBlock } from "@/features/training/workoutGenerator/replacementPools";
import type {
  FilledBlockResult,
  FinishedWorkout,
} from "@/features/training/workoutGenerator/stages/workoutFinish";
import type {
  BranchesBlock,
  InterpretedWorkout,
} from "@/features/training/workoutGenerator/stages/blockWalk";
import {
  generateSetList,
  type WorkoutGenerationRequest,
  type WorkoutSelection,
} from "@/features/training/workoutGeneratorRouter";

/**
 * The branches a custom workout drew on its first start at one place, as one
 * branches block per drawn template block. `templateBlocks` fingerprints the
 * template, so a template change starts a fresh draw.
 */
export type DrawnWorkout = {
  templateBlocks: string;
  drawnBlocks: DrawnBlock[];
};

type DrawnWorkoutSetListInput = {
  request: WorkoutGenerationRequest;
  selection: WorkoutSelection;
  drawnWorkout?: DrawnWorkout;
  random: () => number;
};

type DrawnWorkoutSetList = {
  setList: GeneratedSetListEntry[];
  drawnWorkoutToSave: DrawnWorkout | null;
};

// A swapped cardio block saves its original, so a replay tries it again.
const readBranches = (result: FilledBlockResult): string[] =>
  result.swappedFrom
    ? result.swappedFrom.branches
    : [...new Set(result.exercises.map(({ branchId }) => branchId))];

// Copies only the timing fields, because a branches block logs a warning for
// each picks setting it ignores.
const toBranchesBlock = (
  result: FilledBlockResult,
  branches: string[],
): BranchesBlock => {
  const source = result.swappedFrom ?? result.block;
  const { skill, sets, setDuration, values, rest, superset } = source;
  const duration = source.kind === "picks" ? undefined : source.duration;
  return {
    kind: "branches",
    skill,
    branches,
    ...(sets !== undefined && { sets }),
    ...(setDuration !== undefined && { setDuration }),
    ...(values !== undefined && { values }),
    ...(rest !== undefined && { rest }),
    ...(superset !== undefined && { superset }),
    ...(duration !== undefined && { duration }),
  };
};

/**
 * Reads the drawn blocks of a finished workout: the branches of each filled
 * block in draw order, and the template index of each picks block, from which
 * a replay rebuilds the replacement pool.
 *
 * readDrawnBlocks({ blocks: [<GKS picks result: 523, 510>], setList }, template)
 * → [{ block: { kind: "branches", skill: "GKS", branches: ["523", "510"] }, templateIndex: 0 }]
 */
export const readDrawnBlocks = (
  finished: FinishedWorkout<GeneratedSetListEntry>,
  template: InterpretedWorkout,
): DrawnBlock[] =>
  finished.blocks.flatMap((result): DrawnBlock[] => {
    if (result.status !== "filled") return [];
    const branches = readBranches(result);
    if (branches.length === 0) return [];
    const block = toBranchesBlock(result, branches);
    if (result.swappedFrom || result.block.kind !== "picks") return [{ block }];
    return [{ block, templateIndex: template.blocks.indexOf(result.block) }];
  });

/**
 * Replays the drawn workout while the template blocks are unchanged.
 * Otherwise generates fresh and returns the drawn workout to save, or null when
 * no block drew a branch.
 */
export const generateSetListFromDrawnWorkout = ({
  request,
  selection,
  drawnWorkout,
  random,
}: DrawnWorkoutSetListInput): DrawnWorkoutSetList => {
  const templateBlocks = JSON.stringify(selection.workout.blocks);
  const previousDrawnBlocks =
    drawnWorkout?.templateBlocks === templateBlocks
      ? drawnWorkout.drawnBlocks
      : undefined;
  const finished = generateSetList(selection, request, {
    random,
    previousDrawnBlocks,
  });
  if (previousDrawnBlocks) {
    return { setList: finished.setList, drawnWorkoutToSave: null };
  }
  const drawnBlocks = readDrawnBlocks(finished, selection.workout);
  return {
    setList: finished.setList,
    drawnWorkoutToSave:
      drawnBlocks.length > 0 ? { templateBlocks, drawnBlocks } : null,
  };
};
