import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { UserTrainingType } from "@/features/training/models/UserTraining";

const sameValues = (a: string[], b: string[]): boolean => {
  const sortedB = [...b].sort();
  return (
    a.length === b.length &&
    [...a].sort().every((value, index) => value === sortedB[index])
  );
};

const sameLengths = (
  a: UserTrainingType["lengths"],
  b: UserTrainingType["lengths"],
): boolean =>
  sameValues(Object.keys(a), Object.keys(b)) &&
  Object.entries(a).every(
    ([skill, minutes]) => b[skill as keyof typeof b] === minutes,
  );

const isUnchanged = (
  oldTraining: UserTrainingType,
  newTraining: UserTrainingType,
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

/**
 * A regenerated training day keeps its old branches when its focus, skill list,
 * minute budgets and place equipment stayed the same; every other day redraws.
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
      return oldTraining && isUnchanged(oldTraining, training)
        ? { ...training, skills: oldTraining.skills }
        : training;
    }),
  })),
});
