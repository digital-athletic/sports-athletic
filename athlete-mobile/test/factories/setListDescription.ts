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
