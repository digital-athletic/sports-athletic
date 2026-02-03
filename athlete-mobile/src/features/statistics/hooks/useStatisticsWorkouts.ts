import {
  useCompletedWorkoutsStore,
  type CompleteWorkoutType,
} from "@/store/completedWorkoutsStore";
import { useMemo } from "react";

/**
 * Hook to get completed workouts for statistics display.
 * Returns workouts sorted by timestamp (newest first).
 */
export const useStatisticsWorkouts = (): CompleteWorkoutType[] => {
  const { workouts } = useCompletedWorkoutsStore();

  return useMemo(() => {
    return Object.values(workouts).sort((a, b) => b.timestamp - a.timestamp);
  }, [workouts]);
};
