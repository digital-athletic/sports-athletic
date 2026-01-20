export type SetListEntryType = {
  exerciseId: number;
  set: [number, number];
  duration?: number;
  height?: number;
  repetition?: number;
  weight?: number;
};

/**
 * Extended set list entry with branch and skill information.
 * Used during training generation to track the full context of each exercise set.
 *
 * Note: branchId of -1 indicates a placeholder/pause entry, not a real branch.
 */
export type GeneratedSetListEntry = {
  branchId: number;
  exerciseId: number;
  /** Tuple of [setNumber, totalSets] or [setNumber, repetitionCount] */
  set: [number, number];
  skill: string;
  duration?: number;
  repetition?: number;
  weight?: number;
  height?: number;
  weightType?: string;
};
