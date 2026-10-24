import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { createExerciseMap } from "@/features/training/utils/exerciseAccessor";
import { getOpposingExerciseDirection } from "@/features/training/utils/exerciseUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValue } from "@/utils/tagUtils";
import { resolveBranchExerciseId } from "./branchResolution";
import type { GenerationInput } from "./generationInput";

/** A drawn superset lead and the partner drawn for it, if any. */
export interface DrawnBranchPair {
  readonly lead: BranchExerciseReference;
  readonly partner?: BranchExerciseReference;
}

/** The draws of one branch and of one superset pair from the given branches. */
export interface BranchDraw {
  readonly single: (
    branches: SkillTreeType,
    usedBranchIds: readonly string[],
  ) => BranchExerciseReference | null;
  readonly pair: (
    branches: SkillTreeType,
    usedBranchIds: readonly string[],
  ) => DrawnBranchPair | null;
}

/** What the branch draws read besides the branches they draw from. */
export interface BranchDrawSource
  extends Pick<GenerationInput, "exerciseCatalog" | "exerciseData" | "random"> {
  /** The fitness level resolution starts from, e.g. "ADVANCED". */
  readonly fitnessLevel: string;
  /** The workout pool; the exercises of used branches resolve against it. */
  readonly pool: SkillTreeType;
}

interface PairDrawSource extends BranchDrawSource {
  readonly exerciseMap: ReadonlyMap<string, ExerciseType>;
}

interface DrawCandidate {
  readonly branchId: string;
  readonly exerciseId: string;
}

const resolveCandidateExerciseId = (
  source: BranchDrawSource,
  branches: SkillTreeType,
  branchId: string,
): string | null => {
  if (!Object.hasOwn(branches, branchId)) return null;
  const { branchData } = source.exerciseData;
  return resolveBranchExerciseId(
    branches[branchId],
    source.fitnessLevel,
    Object.hasOwn(branchData, branchId) ? branchData[branchId] : undefined,
  );
};

// A branch without a resolvable exercise is never drawn; neither a branch nor
// a resolved exercise repeats within the workout.
const listDrawCandidates = (
  source: BranchDrawSource,
  branches: SkillTreeType,
  usedBranchIds: readonly string[],
): DrawCandidate[] => {
  const usedExerciseIds = usedBranchIds.map((branchId) =>
    resolveCandidateExerciseId(source, source.pool, branchId),
  );
  return Object.keys(branches).flatMap((branchId) => {
    if (usedBranchIds.includes(branchId)) return [];
    const exerciseId = resolveCandidateExerciseId(source, branches, branchId);
    return exerciseId && !usedExerciseIds.includes(exerciseId)
      ? [{ branchId, exerciseId }]
      : [];
  });
};

const drawCandidate = (
  source: BranchDrawSource,
  branches: SkillTreeType,
  candidates: DrawCandidate[],
): BranchExerciseReference => {
  const { branchId, exerciseId } =
    candidates[Math.floor(source.random() * candidates.length)];
  return { branchId, branchTags: branches[branchId].tags, exerciseId };
};

const drawSingleBranch = (
  source: BranchDrawSource,
  branches: SkillTreeType,
  usedBranchIds: readonly string[],
): BranchExerciseReference | null => {
  const candidates = listDrawCandidates(source, branches, usedBranchIds);
  return candidates.length === 0
    ? null
    : drawCandidate(source, branches, candidates);
};

// Without a direction, the bare placeholder matches no exercise tag.
const readOppositeDirection = (exerciseTags: string[]): string => {
  const direction = getTagValue(exerciseTags, TagGroups.EXERCISE_DIRECTION);
  return (
    (direction && getOpposingExerciseDirection(direction)) || "noDirection"
  );
};

// Draws each candidate in turn: the last both sided one becomes the partner,
// and one tagged with the opposite direction ends the search.
const drawBothSidedPartner = (
  source: PairDrawSource,
  branches: SkillTreeType,
  candidates: DrawCandidate[],
  lead: { usedBranchIds: string[]; oppositeDirection: string },
): BranchExerciseReference | undefined => {
  let partner: BranchExerciseReference | undefined;
  for (const { branchId } of candidates) {
    const drawn = drawSingleBranch(
      source,
      { [branchId]: branches[branchId] },
      lead.usedBranchIds,
    );
    const tags = drawn && source.exerciseMap.get(drawn.exerciseId)?.tags;
    if (!drawn || !tags?.includes("SIDE_BOTH")) continue;
    partner = drawn;
    if (tags.includes(lead.oppositeDirection)) break;
  }
  return partner;
};

// A both sided exercise seeks a both sided partner and trains alone without one.
const drawBranchPair = (
  source: PairDrawSource,
  branches: SkillTreeType,
  usedBranchIds: readonly string[],
): DrawnBranchPair | null => {
  const candidates = listDrawCandidates(source, branches, usedBranchIds);
  if (candidates.length === 0) return null;
  const lead = drawCandidate(source, branches, candidates);
  const leadTags = source.exerciseMap.get(lead.exerciseId)?.tags;
  if (!leadTags?.includes("SIDE_BOTH")) return { lead };
  const partner = drawBothSidedPartner(source, branches, candidates, {
    usedBranchIds: [...usedBranchIds, lead.branchId],
    oppositeDirection: readOppositeDirection(leadTags),
  });
  return { lead, partner };
};

/**
 * Builds the single and pair draws of a short workout. Each draw picks one
 * candidate uniformly through source.random; a pair whose lead is both sided
 * draws once more for every remaining candidate while it seeks a partner.
 *
 * createBranchDraw(source).single({ 1: ..., 2: ... }, ["1"])
 * → { branchId: "2", branchTags: [...], exerciseId: "e2" }
 */
export const createBranchDraw = (source: BranchDrawSource): BranchDraw => {
  const pairSource: PairDrawSource = {
    ...source,
    exerciseMap: createExerciseMap(source.exerciseCatalog),
  };
  return {
    single: (branches, usedBranchIds) =>
      drawSingleBranch(source, branches, usedBranchIds),
    pair: (branches, usedBranchIds) =>
      drawBranchPair(pairSource, branches, usedBranchIds),
  };
};
