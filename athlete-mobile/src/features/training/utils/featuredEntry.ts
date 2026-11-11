import {
  type ChecklistEntry,
  type ChecklistEntryBlock,
} from "@/features/training/hooks/useTrainingListRows";

/**
 * The key of the one exercise whose start button is filled: the first paused
 * exercise, else the exercise of the set that comes next. Null when every set
 * is completed.
 */
export function findFeaturedEntryKey(
  blocks: ChecklistEntryBlock[],
  upcomingSetIndex: number | null,
  resumeSecondsOf: (setIndex: number) => number | undefined,
): number | null {
  const entries = blocks.flatMap((block) => block.entries);
  const isPaused = (entry: ChecklistEntry) =>
    entry.firstOpenSetIndex !== null &&
    resumeSecondsOf(entry.firstOpenSetIndex) !== undefined;
  const isUpcoming = (entry: ChecklistEntry) =>
    entry.sets.some((set) => set.index === upcomingSetIndex);

  return (entries.find(isPaused) ?? entries.find(isUpcoming))?.key ?? null;
}
