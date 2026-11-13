import { isSkillTypes } from "@/constants/workoutConstants";
import { toExerciseBranch } from "@/features/training/exerciseSwap/exerciseSwap";
import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import {
  type AiwlTrainingType,
  type CopiedBranchesType,
  isOldTraining,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";
import {
  type BranchLookupIndex,
  findCatalogBranch,
  loadBranchLookupIndex,
} from "@/features/training/workoutGenerator/generationInput/branchLookupIndex";

// Writes the catalog branches of each branches block under the block's skill.
const resolveWorkoutBranches = (
  { workout }: AiwlTrainingType,
  branchLookupIndex: BranchLookupIndex,
): CopiedBranchesType => {
  const branches: CopiedBranchesType = {};
  for (const block of workout.blocks) {
    if (block.kind !== "branches" || !isSkillTypes(block.skill)) continue;
    const resolved = block.branches.flatMap((branchId) => {
      const branch = findCatalogBranch(branchLookupIndex, branchId);
      return branch ? [toExerciseBranch({ branchId, branch })] : [];
    });
    branches[block.skill] = [...(branches[block.skill] ?? []), ...resolved];
  }
  return branches;
};

/**
 * Returns the branches a training plans, per skill. An old training returns
 * its copied branches. An AIWL training resolves the branch IDs of its
 * branches blocks through the skill catalog, with tags and an exercise per
 * level. The catalog lacks some IDs, and the generator replaces those at run
 * time, so this function skips them.
 *
 * readPlannedBranches({ workout: { blocks: [{ kind: "branches", skill: "GKS", branches: ["510"] }] } })
 * → { GKS: [{ branchId: "510", tags: [...], exercises: { 1: { exerciseId: "25" }, ... } }] }
 */
export const readPlannedBranches = (
  training: UserTrainingType,
  branchLookupIndex: BranchLookupIndex = loadBranchLookupIndex(),
): CopiedBranchesType =>
  isOldTraining(training)
    ? training.skills
    : resolveWorkoutBranches(training, branchLookupIndex);

const listBranchExerciseIds = (branch: ExerciseBranchType): string[] =>
  Object.values(branch.exercises).flatMap(({ exerciseId }) =>
    exerciseId ? [exerciseId] : [],
  );

/**
 * Lists the exercises of every level of every branch the trainings plan, each
 * exercise once, in plan order.
 */
export const listPlannedExerciseIds = (
  trainings: readonly UserTrainingType[],
  branchLookupIndex: BranchLookupIndex = loadBranchLookupIndex(),
): string[] => {
  const exerciseIds = trainings.flatMap((training) =>
    Object.entries(readPlannedBranches(training, branchLookupIndex)).flatMap(
      ([skill, branches]) =>
        isSkillTypes(skill)
          ? (branches ?? []).flatMap(listBranchExerciseIds)
          : [],
    ),
  );
  return [...new Set(exerciseIds)];
};
