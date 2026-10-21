import {
  type UseWorkoutsDataParams,
  UserSkills,
  type WorkoutsSummary,
} from "@/features/statistics/models/WorkoutsData";
import { filterWorkoutsByRange } from "@/features/statistics/models/rangeFilter";
import { useUserProfileStore } from "@/store/userProfileStore";

const INITIAL_USER_SKILLS: UserSkills = {
  PREVENTION: 0,
  MOBILITY: 0,
  SWR: 0,
  WARMUP: 0,
  STABILITY: 0,
  CARDIO: 0,
};

/**
 * Custom hook for Workouts statistics data.
 */
export const useWorkoutsData = ({
  scale,
  workouts,
  trainingPlan = null,
}: UseWorkoutsDataParams) => {
  const anamnesisCompleted = useUserProfileStore(
    (state) => state.anamnesisCompleted,
  );

  const filteredWorkouts = filterWorkoutsByRange(workouts, scale, trainingPlan);

  const summaryData: WorkoutsSummary = filteredWorkouts.reduce(
    (acc, workout) => ({
      duration: acc.duration + (workout.duration || 0),
      count: acc.count + (workout.exerciseCount || 0),
      xp: acc.xp + (workout.xpEarned || 0),
      weight: acc.weight + (workout.movedWeight || 0),
    }),
    { duration: 0, count: 0, xp: 0, weight: 0 },
  );

  const userSkills: UserSkills = filteredWorkouts.reduce(
    (acc, workout) => ({
      PREVENTION: acc.PREVENTION + (workout.userSkills?.PREVENTION || 0),
      MOBILITY: acc.MOBILITY + (workout.userSkills?.MOBILITY || 0),
      SWR: acc.SWR + (workout.userSkills?.SWR || 0),
      WARMUP: acc.WARMUP + (workout.userSkills?.WARMUP || 0),
      STABILITY: acc.STABILITY + (workout.userSkills?.STABILITY || 0),
      CARDIO: acc.CARDIO + (workout.userSkills?.CARDIO || 0),
    }),
    { ...INITIAL_USER_SKILLS },
  );

  const sortedWorkouts = [...workouts].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  const hasWorkouts = workouts.length > 0;

  return {
    summaryData,
    userSkills,
    sortedWorkouts,
    hasWorkouts,
    anamnesisCompleted,
  };
};
