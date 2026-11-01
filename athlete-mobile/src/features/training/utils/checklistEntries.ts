import { isPauseExercise } from "@/features/training/models/IdTypes";
import { type UserExerciseDataType } from "@/schemas/sync.schema";

/** The sets of one exercise; key is the list index of its first set. */
export type ChecklistEntryGroup = {
  key: number;
  exerciseId: string;
  setIndices: number[];
};

/** Exercises whose sets alternate; a block with more than one is a superset. */
export type ChecklistBlock = {
  entries: ChecklistEntryGroup[];
  isSuperset: boolean;
};

const totalSets = (exercise: UserExerciseDataType): number =>
  exercise.set?.[1] ?? 1;

const isOpenSet = (exercise: UserExerciseDataType | undefined): boolean =>
  !!exercise && !isPauseExercise(exercise.exerciseId) && !exercise.completed;

/**
 * Groups the sets of the exercise list into one entry per exercise. The list
 * marks no superset, so an exercise that starts while another one still has
 * sets to go joins that exercise's block: A 1/2, B 1/2, A 2/2, B 2/2.
 */
export function groupChecklistEntries(
  exerciseList: UserExerciseDataType[],
): ChecklistBlock[] {
  const blocks: ChecklistBlock[] = [];
  const setTotals = new Map<ChecklistEntryGroup, number>();
  const isUnfinished = (group: ChecklistEntryGroup) =>
    group.setIndices.length < (setTotals.get(group) ?? 1);

  exerciseList.forEach((exercise, index) => {
    if (isPauseExercise(exercise.exerciseId)) return;

    const block = blocks.at(-1);
    const continued = block?.entries.find(
      (group) => group.exerciseId === exercise.exerciseId && isUnfinished(group),
    );
    if (continued) {
      continued.setIndices.push(index);
      return;
    }

    const group = {
      key: index,
      exerciseId: exercise.exerciseId,
      setIndices: [index],
    };
    setTotals.set(group, totalSets(exercise));
    if (block?.entries.some(isUnfinished)) {
      block.entries.push(group);
      block.isSuperset = true;
    } else {
      blocks.push({ entries: [group], isSuperset: false });
    }
  });

  return blocks;
}

/**
 * The first open set among the given list indices, or among all sets when
 * none are given: the set the step-by-step view runs next.
 */
export function findFirstOpenSetIndex(
  exerciseList: UserExerciseDataType[],
  setIndices: number[] = exerciseList.map((_, index) => index),
): number | null {
  return setIndices.find((index) => isOpenSet(exerciseList[index])) ?? null;
}
