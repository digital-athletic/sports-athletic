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

const isOpenSet = (exercise: UserExerciseDataType | undefined): boolean =>
  !!exercise && !isPauseExercise(exercise.exerciseId) && !exercise.completed;

function collectEntryGroups(exerciseList: UserExerciseDataType[]) {
  const groups: ChecklistEntryGroup[] = [];
  const latestGroups = new Map<string, ChecklistEntryGroup>();

  exerciseList.forEach((exercise, index) => {
    if (isPauseExercise(exercise.exerciseId)) return;

    const identity = JSON.stringify([
      exercise.exerciseId,
      exercise.skill,
      exercise.branchId,
    ]);
    const previousGroup = latestGroups.get(identity);
    const previousSet = previousGroup
      ? exerciseList[
          previousGroup.setIndices[previousGroup.setIndices.length - 1]
        ].set
      : undefined;
    const set = exercise.set;
    // Support sets can repeat the main lift's set number. A reset starts a new entry.
    const continues =
      previousSet &&
      set &&
      set[1] === previousSet[1] &&
      previousSet[0] < previousSet[1] &&
      set[0] > 1 &&
      set[0] >= previousSet[0];

    if (previousGroup && continues) {
      previousGroup.setIndices.push(index);
      return;
    }

    const group: ChecklistEntryGroup = {
      key: index,
      exerciseId: exercise.exerciseId,
      setIndices: [index],
    };
    groups.push(group);
    latestGroups.set(identity, group);
  });

  return groups;
}

/**
 * Groups exercises whose actual set ranges overlap into a superset. MAX
 * support sets inherit the lift's set tuple, so its total is not their count.
 */
export function groupChecklistEntries(
  exerciseList: UserExerciseDataType[],
): ChecklistBlock[] {
  const blocks: ChecklistBlock[] = [];
  let blockEnd = -1;

  for (const group of collectEntryGroups(exerciseList)) {
    const block = blocks.at(-1);
    const lastIndex = group.setIndices[group.setIndices.length - 1];
    if (block && group.key <= blockEnd) {
      block.entries.push(group);
      block.isSuperset = true;
      blockEnd = Math.max(blockEnd, lastIndex);
    } else {
      blocks.push({ entries: [group], isSuperset: false });
      blockEnd = lastIndex;
    }
  }

  return blocks;
}

/**
 * The first open set among the given list indices, or among all sets when
 * none are given.
 */
export function findFirstOpenSetIndex(
  exerciseList: UserExerciseDataType[],
  setIndices: number[] = exerciseList.map((_, index) => index),
): number | null {
  return setIndices.find((index) => isOpenSet(exerciseList[index])) ?? null;
}

/** True once a completed, unskipped set has saved its progression. */
export const hasSavedProgress = (
  exerciseList: readonly UserExerciseDataType[],
): boolean =>
  exerciseList.some(
    (exercise) =>
      exercise.completed &&
      !exercise.skipped &&
      !isPauseExercise(exercise.exerciseId),
  );

/** The next open set after the current one, without wrapping to earlier sets. */
export function findNextOpenSetIndex(
  exerciseList: readonly UserExerciseDataType[],
  finishedIndex: number,
): number | null {
  for (let index = finishedIndex + 1; index < exerciseList.length; index += 1) {
    if (isOpenSet(exerciseList[index])) return index;
  }
  return null;
}
