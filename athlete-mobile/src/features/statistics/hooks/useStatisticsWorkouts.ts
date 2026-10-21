import {
  useCompletedWorkoutsStore,
  type CompleteWorkoutType,
} from "@/store/completedWorkoutsStore";

/**
 * Hook to get completed workouts for statistics display.
 * Returns workouts sorted by timestamp (newest first).
 */
export const useStatisticsWorkouts = (): CompleteWorkoutType[] => {
  const { workouts } = useCompletedWorkoutsStore();

  return Object.values(workouts).sort((a, b) => b.timestamp - a.timestamp);
};
