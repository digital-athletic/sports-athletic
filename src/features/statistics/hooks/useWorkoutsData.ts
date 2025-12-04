import {
  type ScaleType,
  type UseWorkoutsDataParams,
  UserSkills,
  type WorkoutsSummary,
} from "@/features/statistics/models/WorkoutsData";
import { type TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useMemo } from "react";

const INITIAL_USER_SKILLS: UserSkills = {
  PREVENTION: 0,
  MOBILITY: 0,
  SWR: 0,
  WARMUP: 0,
  STABILITY: 0,
  CARDIO: 0,
};

/**
 * Gets start date timestamp based on scale.
 */
const getStartDate = (
  scale: ScaleType,
  trainingPlan: TrainingPlanType | null,
): number => {
  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;

  switch (scale) {
    case "week":
      return now - DAY * 7;
    case "month":
      return now - DAY * 30;
    case "year":
      return now - DAY * 365;
    case "total":
    default:
      // For phase, find active section
      if (trainingPlan?.sections && trainingPlan.sections.length > 0) {
        for (let i = 0; i < trainingPlan.sections.length; i++) {
          const sectionStart = trainingPlan.sections[i].start;
          const startTime = new Date(sectionStart).getTime();
          if (startTime < now) {
            return startTime;
          }
        }
      }
      return 0;
  }
};

/**
 * Custom hook for Workouts statistics data.
 */
export const useWorkoutsData = ({
  scale,
  workoutsList,
  trainingPlan = null,
}: UseWorkoutsDataParams) => {
  const anamnesisCompleted = useUserProfileStore(
    (state) => state.anamnesisCompleted,
  );

  const filteredWorkouts = useMemo(() => {
    const startDate = getStartDate(scale, trainingPlan);
    return workoutsList.filter((workout) => workout.date > startDate);
  }, [workoutsList, scale, trainingPlan]);

  const summaryData = useMemo((): WorkoutsSummary => {
    return filteredWorkouts.reduce(
      (acc, workout) => ({
        duration: acc.duration + (workout.duration || 0),
        count: acc.count + (workout.exerciseCount || 0),
        points: acc.points + (workout.points || 0),
        weight: acc.weight + (workout.movedWeight || 0),
      }),
      { duration: 0, count: 0, points: 0, weight: 0 },
    );
  }, [filteredWorkouts]);

  const userSkills = useMemo((): UserSkills => {
    return filteredWorkouts.reduce(
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
  }, [filteredWorkouts]);

  const sortedWorkouts = useMemo(() => {
    return [...workoutsList].sort((a, b) => b.date - a.date);
  }, [workoutsList]);

  const hasWorkouts = workoutsList.length > 0;

  return {
    summaryData,
    userSkills,
    sortedWorkouts,
    hasWorkouts,
    anamnesisCompleted,
  };
};
