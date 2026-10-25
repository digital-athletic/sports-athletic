import type { BlockResult } from "@/features/training/workoutGenerator/stages/blockWalk";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateBranchesBlock } from "./templateBlock";

type FilledBlockResult = Extract<BlockResult, { status: "filled" }>;
type EmptyBlockResult = Extract<BlockResult, { status: "empty" }>;

interface FilledBlockResultOptions {
  block?: Block;
  usedBranchIds?: string[];
  exercises?: BranchExerciseReference[];
}

interface EmptyBlockResultOptions {
  block?: Block;
  usedBranchIds?: string[];
  reason?: GeneratorError;
}

/**
 * Builds the result of a block handler. A filled result holds one exercise,
 * an empty result holds no reason and no used branches, unless the options say
 * otherwise.
 *
 * generateBlockResult("filled")
 * → { status: "filled", block: { kind: "branches", skill: "GKS", ... }, usedBranchIds: [],
 *     exercises: [{ branchId: "1", branchTags: [], exerciseId: "10" }] }
 * generateBlockResult("empty", { reason })
 * → { status: "empty", block: { kind: "branches", skill: "GKS", ... }, reason, usedBranchIds: [] }
 */
export function generateBlockResult(
  status: "filled",
  options?: FilledBlockResultOptions,
): FilledBlockResult;
export function generateBlockResult(
  status: "empty",
  options?: EmptyBlockResultOptions,
): EmptyBlockResult;
export function generateBlockResult(
  status: "filled" | "empty",
  options: FilledBlockResultOptions & EmptyBlockResultOptions = {},
): BlockResult {
  const { block = generateBranchesBlock(), usedBranchIds = [] } = options;
  return status === "filled"
    ? {
        status,
        block,
        usedBranchIds,
        exercises: options.exercises ?? [
          { branchId: "1", branchTags: [], exerciseId: "10" },
        ],
      }
    : { status, block, usedBranchIds, reason: options.reason };
}

/**
 * Builds a filled result with one exercise per branch ID. The exercise ID
 * comes from the reader, "exercise<branch ID>" by default; the branch IDs
 * count as used.
 *
 * generateFilledBlockResult(block, ["510"])
 * → { status: "filled", block, usedBranchIds: ["510"],
 *     exercises: [{ branchId: "510", branchTags: [], exerciseId: "exercise510" }] }
 */
export const generateFilledBlockResult = (
  block: Block,
  branchIds: string[],
  readExerciseId = (branchId: string) => `exercise${branchId}`,
): FilledBlockResult =>
  generateBlockResult("filled", {
    block,
    usedBranchIds: branchIds,
    exercises: branchIds.map((branchId) => ({
      branchId,
      branchTags: [],
      exerciseId: readExerciseId(branchId),
    })),
  });

/**
 * Builds a filled result whose branches resolve to the given exercises of a
 * catalog. The branch of exercise "e1" is "be1" and carries its tags.
 *
 * generateFilledResultFromCatalog(catalog, block, ["e1"])
 * → { status: "filled", block, usedBranchIds: ["be1"],
 *     exercises: [{ branchId: "be1", branchTags: [...tags of e1], exerciseId: "e1" }] }
 */
export const generateFilledResultFromCatalog = (
  exerciseCatalog: ExerciseType[],
  block: Block,
  exerciseIds: string[],
): FilledBlockResult =>
  generateBlockResult("filled", {
    block,
    usedBranchIds: exerciseIds.map((id) => `b${id}`),
    exercises: exerciseIds.map((id) => ({
      branchId: `b${id}`,
      branchTags:
        exerciseCatalog.find((exercise) => exercise.id === id)?.tags ?? [],
      exerciseId: id,
    })),
  });

/**
 * Builds an empty result for a block, with the reason the handler recorded.
 *
 * generateEmptyBlockResult(block, equipmentError)
 * → { status: "empty", block, reason: equipmentError, usedBranchIds: [] }
 */
export const generateEmptyBlockResult = (
  block: Block,
  reason?: GeneratorError,
  usedBranchIds: string[] = [],
): EmptyBlockResult =>
  generateBlockResult("empty", { block, reason, usedBranchIds });

/**
 * Builds a filled result for a branches block of the skill whose one branch
 * "1" resolves to the exercise.
 *
 * generateFilledBranchesResult("GKS", "10")
 * → { status: "filled", block: { kind: "branches", skill: "GKS", branches: ["1"], ... },
 *     usedBranchIds: ["1"], exercises: [{ branchId: "1", branchTags: [], exerciseId: "10" }] }
 */
export const generateFilledBranchesResult = (
  skill: string,
  exerciseId = "10",
): FilledBlockResult =>
  generateFilledBlockResult(
    generateBranchesBlock(skill, ["1"]),
    ["1"],
    () => exerciseId,
  );

/**
 * Builds an empty result for a branches block of the skill.
 *
 * generateEmptyBranchesResult("GKS", equipmentError)
 * → { status: "empty", block: { kind: "branches", skill: "GKS", branches: ["1"], ... },
 *     reason: equipmentError, usedBranchIds: [] }
 */
export const generateEmptyBranchesResult = (
  skill: string,
  reason?: GeneratorError,
): EmptyBlockResult =>
  generateEmptyBlockResult(generateBranchesBlock(skill, ["1"]), reason);
