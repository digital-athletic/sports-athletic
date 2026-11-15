import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  type AiwlTrainingType,
  isLegacyTraining,
  type LegacyTrainingType,
  readCopiedBranches,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";
import type { Block } from "@/schemas/aiwl.schema";

const sameValues = (a: string[], b: string[]): boolean => {
  const sortedB = [...b].sort();
  return (
    a.length === b.length &&
    [...a].sort().every((value, index) => value === sortedB[index])
  );
};

const sameLengths = (
  a: LegacyTrainingType["lengths"],
  b: LegacyTrainingType["lengths"],
): boolean =>
  sameValues(Object.keys(a), Object.keys(b)) &&
  Object.entries(a).every(
    ([skill, minutes]) => b[skill as keyof typeof b] === minutes,
  );

const sameFocusAndEquipment = (
  oldTraining: UserTrainingType,
  newTraining: UserTrainingType,
): boolean =>
  oldTraining.focus === newTraining.focus &&
  oldTraining.equipment !== undefined &&
  newTraining.equipment !== undefined &&
  sameValues(oldTraining.equipment, newTraining.equipment);

const isUnchanged = (
  oldTraining: LegacyTrainingType,
  newTraining: LegacyTrainingType,
): boolean =>
  sameFocusAndEquipment(oldTraining, newTraining) &&
  sameValues(
    Object.keys(oldTraining.skills),
    Object.keys(newTraining.skills),
  ) &&
  sameLengths(oldTraining.lengths, newTraining.lengths);

/** The old branches a regenerated legacy training day keeps, if any. */
const readKeptBranches = (
  oldTraining: LegacyTrainingType,
  newTraining: LegacyTrainingType,
): LegacyTrainingType["skills"] | undefined =>
  isUnchanged(oldTraining, newTraining)
    ? readCopiedBranches(oldTraining)
    : undefined;

// Two branches blocks match when their skill and duration match.
const sameBlockShape = (oldBlock: Block, newBlock: Block): boolean =>
  oldBlock.kind === "branches" &&
  newBlock.kind === "branches" &&
  oldBlock.skill === newBlock.skill &&
  oldBlock.duration === newBlock.duration;

/**
 * The new AIWL training with the branch IDs of the old one, when the focus,
 * place equipment and every block's skill and duration stayed the same.
 */
const keepAiwlBranchIds = (
  oldTraining: AiwlTrainingType,
  newTraining: AiwlTrainingType,
): AiwlTrainingType => {
  const oldBlocks = oldTraining.workout.blocks;
  const newBlocks = newTraining.workout.blocks;
  const unchanged =
    sameFocusAndEquipment(oldTraining, newTraining) &&
    oldBlocks.length === newBlocks.length &&
    newBlocks.every((block, index) => sameBlockShape(oldBlocks[index], block));
  if (!unchanged) return newTraining;
  return {
    ...newTraining,
    workout: {
      ...newTraining.workout,
      blocks: newBlocks.map((block, index) => {
        const oldBlock = oldBlocks[index];
        return block.kind === "branches" && oldBlock.kind === "branches"
          ? { ...block, branches: oldBlock.branches }
          : block;
      }),
    },
  };
};

const keepUnchangedTraining = (
  oldTraining: UserTrainingType | undefined,
  newTraining: UserTrainingType,
): UserTrainingType => {
  if (!oldTraining) return newTraining;
  if (isLegacyTraining(oldTraining) && isLegacyTraining(newTraining)) {
    const keptBranches = readKeptBranches(oldTraining, newTraining);
    return keptBranches
      ? { ...newTraining, skills: keptBranches }
      : newTraining;
  }
  if (!isLegacyTraining(oldTraining) && !isLegacyTraining(newTraining)) {
    return keepAiwlBranchIds(oldTraining, newTraining);
  }
  return newTraining;
};

/**
 * A regenerated training day keeps its old branches when its focus and place
 * equipment stayed the same, and for a legacy training its skill list and minute
 * budgets, for an AIWL training the skill and duration of every block. Every
 * other day redraws, as does a day whose format changed between the plans.
 */
export const keepUnchangedTrainingDays = (
  oldPlan: TrainingPlanType,
  newPlan: TrainingPlanType,
): TrainingPlanType => ({
  ...newPlan,
  sections: newPlan.sections.map((section, sectionIndex) => ({
    ...section,
    trainings: section.trainings.map((training) =>
      keepUnchangedTraining(
        oldPlan.sections[sectionIndex]?.trainings.find(
          (candidate) => candidate.weekday === training.weekday,
        ),
        training,
      ),
    ),
  })),
});
