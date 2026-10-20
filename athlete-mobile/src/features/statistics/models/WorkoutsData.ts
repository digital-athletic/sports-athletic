import type { FocusArea } from "@/schemas/sync.schema";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";

export type ScaleType = "week" | "month" | "year" | "total";

export interface WorkoutsSummary {
  /** Total duration in seconds */
  duration: number;
  count: number;
  xp: number;
  weight: number;
}

export interface UseWorkoutsDataParams {
  scale: ScaleType;
  workouts: CompleteWorkoutType[];
  trainingPlan?: TrainingPlanType | null;
}

export type UserSkills = Record<FocusArea, number>;
