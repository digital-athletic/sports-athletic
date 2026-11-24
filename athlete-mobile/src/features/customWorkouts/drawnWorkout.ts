import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type {
  FilledBlockResult,
  FinishedWorkout,
} from "@/features/training/workoutGenerator/stages/workoutFinish";
import type { BranchesBlock } from "@/features/training/workoutGenerator/stages/blockWalk";
import type { Template } from "@/schemas/aiwl.schema";

/**
 * What a custom workout drew on its first start at one place: an AIWL
 * workout with one branches block per filled template block.
 * `templateModifiedAt` is the last change of the custom workout at that draw,
 * so a later change starts a fresh draw.
 */
export type DrawnWorkout = {
  templateModifiedAt: string;
  workout: Template;
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
