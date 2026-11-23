import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type {
  FilledBlockResult,
  FinishedWorkout,
} from "@/features/training/workoutGenerator/stages/workoutFinish";
import type { BranchesBlock } from "@/features/training/workoutGenerator/stages/blockWalk";
import {
  generateSetList,
  type WorkoutGenerationRequest,
  type WorkoutSelection,
} from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";

/**
 * What a custom workout drew on its first start at one place: an AIWL
 * workout with one branches block per filled template block. `templateBlocks`
 * fingerprints the template, so a template change starts a fresh draw.
 */
export type DrawnWorkout = {
  templateBlocks: string;
  workout: Template;
};

type DrawnWorkoutSetListInput = {
  request: WorkoutGenerationRequest;
  selection: WorkoutSelection;
  template: Template;
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
 * Reads the drawn blocks of a finished workout: one branches block per filled
 * block with its branches in draw order. A block drawn by picks keeps them as
 * `pickedFrom`, so a replay replaces a blocked branch from the same pool.
 *
 * readDrawnBlocks({ blocks: [<GKS picks result: 523, 510>], setList })
 * → [{ kind: "branches", skill: "GKS", branches: ["523", "510"], pickedFrom: { picks: [...] } }]
 */
export const readDrawnBlocks = (
  finished: FinishedWorkout<GeneratedSetListEntry>,
): BranchesBlock[] =>
  finished.blocks.flatMap((result): BranchesBlock[] => {
    if (result.status !== "filled") return [];
    const branches = readBranches(result);
    if (branches.length === 0) return [];
    const block = toBranchesBlock(result, branches);
    if (result.swappedFrom || result.block.kind !== "picks") return [block];
    const { picks, fallbackToWholeTree } = result.block;
    return [
      {
        ...block,
        pickedFrom: {
          picks,
          ...(fallbackToWholeTree !== undefined && { fallbackToWholeTree }),
        },
      },
    ];
  });

/**
 * Runs the drawn workout while the template blocks are unchanged. Otherwise
 * generates fresh from the template and returns the drawn workout to save, or
 * null when no block drew a branch.
 */
export const generateSetListFromDrawnWorkout = ({
  request,
  selection,
  template,
  drawnWorkout,
  random,
}: DrawnWorkoutSetListInput): DrawnWorkoutSetList => {
  const templateBlocks = JSON.stringify(template.blocks);
  if (drawnWorkout?.templateBlocks === templateBlocks) {
    const replay = { ...selection, workout: drawnWorkout.workout };
    const { setList } = generateSetList(replay, request, { random });
    return { setList, drawnWorkoutToSave: null };
  }
  const finished = generateSetList(selection, request, { random });
  const blocks = readDrawnBlocks(finished);
  return {
    setList: finished.setList,
    drawnWorkoutToSave:
      blocks.length > 0
        ? { templateBlocks, workout: { ...template, blocks } }
        : null,
  };
};
