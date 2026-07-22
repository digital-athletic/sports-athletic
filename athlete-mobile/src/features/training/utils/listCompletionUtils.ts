/**
 * Counts how many of the given (already visible, non-pause) row indices
 * have not yet been marked complete.
 */
export function getIncompleteCount(
  rowIndices: number[],
  completedIndices: number[],
): number {
  const completed = new Set(completedIndices);
  return rowIndices.filter((index) => !completed.has(index)).length;
}
