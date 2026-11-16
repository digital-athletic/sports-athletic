import { isPauseExercise } from "@/features/training/models/IdTypes";
import { groupChecklistEntries } from "@/features/training/utils/checklistEntries";
import { type UserExerciseDataType } from "@/schemas/sync.schema";

const STRENGTH_TEST_REPETITION = -1;

const isDoneExerciseSet = (exercise: UserExerciseDataType) =>
  exercise.completed === true &&
  exercise.skipped !== true &&
  !isPauseExercise(exercise.exerciseId);

/**
 * Whether an early finish is saved: a done set the workout totals count, in a
 * list without strength test sets, as the success screen saves no test.
 */
export const hasCompletedExerciseSet = (
  exerciseList: UserExerciseDataType[],
): boolean =>
  !exerciseList.some(
    (exercise) => exercise.repetition === STRENGTH_TEST_REPETITION,
  ) &&
  exerciseList.some(
    (exercise) => isDoneExerciseSet(exercise) && exercise.set !== undefined,
  );

/**
 * The done sets of an early finished training, in list order. The sets of
 * each exercise are renumbered, so its last done set closes it and the
 * workout totals count it.
 */
export const keepCompletedSets = (
  exerciseList: UserExerciseDataType[],
): UserExerciseDataType[] => {
  const renumberedSets = new Map<number, [number, number]>();
  for (const block of groupChecklistEntries(exerciseList)) {
    for (const entry of block.entries) {
      const doneIndices = entry.setIndices.filter((index) =>
        isDoneExerciseSet(exerciseList[index]),
      );
      doneIndices.forEach((index, position) => {
        renumberedSets.set(index, [position + 1, doneIndices.length]);
      });
    }
  }

  return exerciseList.flatMap((exercise, index) => {
    if (!isDoneExerciseSet(exercise)) return [];
    const set = renumberedSets.get(index);
    return exercise.set && set ? [{ ...exercise, set }] : [exercise];
  });
};
