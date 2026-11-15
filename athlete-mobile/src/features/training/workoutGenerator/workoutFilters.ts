/** The athlete filters a workout applies; false switches a filter off. */
export interface WorkoutFilters {
  readonly soreness: boolean;
  readonly pain: boolean;
  readonly equipment: boolean;
}

/**
 * Fills every filter the caller leaves out with true.
 *
 * resolveWorkoutFilters({ soreness: false })
 * → { soreness: false, pain: true, equipment: true }
 */
export const resolveWorkoutFilters = (
  filters: Partial<WorkoutFilters> = {},
): WorkoutFilters =>
  Object.freeze({
    soreness: filters.soreness ?? true,
    pain: filters.pain ?? true,
    equipment: filters.equipment ?? true,
  });
