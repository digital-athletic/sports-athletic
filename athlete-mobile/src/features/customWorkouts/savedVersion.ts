import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { SavedBlock } from "@/features/training/workoutGenerator/replacementPools";
import type {
  FilledBlockResult,
  FinishedWorkout,
} from "@/features/training/workoutGenerator/stages/workoutFinish";
import type {
  BranchesBlock,
  InterpretedWorkout,
} from "@/features/training/workoutGenerator/stages/blockWalk";
import {
  generateWorkout,
  type WorkoutGenerationRequest,
  type WorkoutSelection,
} from "@/features/training/workoutGeneratorRouter";

/** The first generation of a custom workout at one place. */
export type SavedVersion = { templateBlocks: string; blocks: SavedBlock[] };

type VersionedSetListInput = {
  request: WorkoutGenerationRequest;
  selection: WorkoutSelection;
  saved?: SavedVersion;
};

type VersionedSetList = {
  setList: GeneratedSetListEntry[];
  versionToSave: SavedVersion | null;
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
 * Reads the saved blocks of a finished workout: the branches of each filled
 * block in draw order, and the template index of each picks block, from which
 * a replay rebuilds the replacement pool.
 *
 * readVersionBlocks({ blocks: [<GKS picks result: 523, 510>], setList }, template)
 * → [{ block: { kind: "branches", skill: "GKS", branches: ["523", "510"] }, templateIndex: 0 }]
 */
export const readVersionBlocks = (
  finished: FinishedWorkout<GeneratedSetListEntry>,
  template: InterpretedWorkout,
): SavedBlock[] =>
  finished.blocks.flatMap((result): SavedBlock[] => {
    if (result.status !== "filled") return [];
    const branches = readBranches(result);
    if (branches.length === 0) return [];
    const block = toBranchesBlock(result, branches);
    if (result.swappedFrom || result.block.kind !== "picks") return [{ block }];
    return [{ block, templateIndex: template.blocks.indexOf(result.block) }];
  });

/**
 * Replays the saved version while the template blocks are unchanged.
 * Otherwise generates fresh and returns the version to save, or null when
 * no block drew a branch.
 */
export const generateVersionedSetList = ({
  request,
  selection,
  saved,
}: VersionedSetListInput): VersionedSetList => {
  const templateBlocks = JSON.stringify(selection.workout.blocks);
  const replayBlocks =
    saved?.templateBlocks === templateBlocks ? saved.blocks : undefined;
  const finished = generateWorkout(selection, request, replayBlocks);
  if (replayBlocks) {
    return { setList: finished.setList, versionToSave: null };
  }
  const blocks = readVersionBlocks(finished, selection.workout);
  return {
    setList: finished.setList,
    versionToSave: blocks.length > 0 ? { templateBlocks, blocks } : null,
  };
};
