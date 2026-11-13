import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  isOldTraining,
  type OldTrainingType,
  readCopiedBranches,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";

const sameValues = (a: string[], b: string[]): boolean => {
  const sortedB = [...b].sort();
  return (
    a.length === b.length &&
    [...a].sort().every((value, index) => value === sortedB[index])
  );
};

const sameLengths = (
  a: OldTrainingType["lengths"],
  b: OldTrainingType["lengths"],
): boolean =>
  sameValues(Object.keys(a), Object.keys(b)) &&
  Object.entries(a).every(
    ([skill, minutes]) => b[skill as keyof typeof b] === minutes,
  );

const isUnchanged = (
  oldTraining: OldTrainingType,
  newTraining: OldTrainingType,
): boolean =>
  oldTraining.focus === newTraining.focus &&
  sameValues(
    Object.keys(oldTraining.skills),
    Object.keys(newTraining.skills),
  ) &&
  sameLengths(oldTraining.lengths, newTraining.lengths) &&
  oldTraining.equipment !== undefined &&
  newTraining.equipment !== undefined &&
  sameValues(oldTraining.equipment, newTraining.equipment);

/** The old branches a regenerated old training day keeps, if any. */
const readKeptBranches = (
  oldTraining: UserTrainingType | undefined,
  newTraining: UserTrainingType,
): OldTrainingType["skills"] | undefined =>
  oldTraining &&
  isOldTraining(oldTraining) &&
  isOldTraining(newTraining) &&
  isUnchanged(oldTraining, newTraining)
    ? readCopiedBranches(oldTraining)
    : undefined;

/**
 * A regenerated training day keeps its old branches when its focus, skill list,
 * minute budgets and place equipment stayed the same; every other day redraws.
 * A training day stored as an AIWL workout on either side always redraws.
 */
export const keepUnchangedTrainingDays = (
  oldPlan: TrainingPlanType,
  newPlan: TrainingPlanType,
): TrainingPlanType => ({
  ...newPlan,
  sections: newPlan.sections.map((section, sectionIndex) => ({
    ...section,
    trainings: section.trainings.map((training) => {
      const oldTraining = oldPlan.sections[sectionIndex]?.trainings.find(
        (candidate) => candidate.weekday === training.weekday,
      );
      const keptBranches = readKeptBranches(oldTraining, training);
      return keptBranches ? { ...training, skills: keptBranches } : training;
    }),
  })),
});
