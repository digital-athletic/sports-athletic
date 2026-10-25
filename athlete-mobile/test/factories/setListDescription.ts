import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";

/**
 * Describes each entry as "<exercise> <set>/<sets>" or "pause <seconds>".
 *
 * describeSetListEntries([ec set [1, 2], pause 90]) → ["ec 1/2", "pause 90"]
 */
export const describeSetListEntries = (
  setList: GeneratedSetListEntry[],
): string[] =>
  setList.map((entry) =>
    isPauseExercise(entry.exerciseId)
      ? `pause ${entry.duration}`
      : `${entry.exerciseId} ${entry.set.join("/")}`,
  );

/**
 * Describes the entries of a set list in one line.
 *
 * describeSetList([ec set [1, 2], pause 90]) → "ec 1/2, pause 90"
 */
export const describeSetList = (setList: GeneratedSetListEntry[]): string =>
  describeSetListEntries(setList).join(", ");

/**
 * Lists the skill of every trained exercise of a set list, pauses left out.
 *
 * listTrainedSkills([MOB e1 1/1, pause, BR e3 1/1]) → ["MOB", "BR"]
 */
export const listTrainedSkills = (setList: GeneratedSetListEntry[]): string[] =>
  setList
    .filter((entry) => !isPauseExercise(entry.exerciseId))
    .map((entry) => entry.skill);

/**
 * Lists the exercise ID of every trained set of a set list, pauses left out.
 *
 * listTrainedExercises([MOB e1 1/1, pause, MOB e2 1/1]) → ["e1", "e2"]
 */
export const listTrainedExercises = (
  setList: GeneratedSetListEntry[],
): string[] =>
  setList
    .filter((entry) => !isPauseExercise(entry.exerciseId))
    .map((entry) => entry.exerciseId);
