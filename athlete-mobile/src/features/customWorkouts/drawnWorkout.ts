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
 * workout with one branches block per filled template block. `templateHash`
 * identifies the template blocks, so a template change starts a fresh draw.
 */
export type DrawnWorkout = {
  templateHash: string;
  workout: Template;
};

/**
 * Hashes the blocks of a template (FNV-1a, 32 bit) into 8 hex digits. Equal
 * blocks give the same hash on every start. The hash only detects a change:
 * in the unlikely case of a collision, a changed template replays its old
 * draw until the athlete refreshes it.
 *
 * hashTemplateBlocks(template.blocks) → "3f2a9c10"
 */
export const hashTemplateBlocks = (blocks: Template["blocks"]): string => {
  let hash = 0x811c9dc5;
  for (const char of JSON.stringify(blocks)) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
 * block with its branches in draw order. A block drawn by picks copies them as
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
  const templateHash = hashTemplateBlocks(template.blocks);
  if (drawnWorkout?.templateHash === templateHash) {
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
        ? { templateHash, workout: { ...template, blocks } }
        : null,
  };
};
