import type { SkillFocusType } from "@/features/training/models/Training";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";

export type ScaleType = "week" | "month" | "year" | "total";

export interface WorkoutsSummary {
  /** Total duration in seconds */
  duration: number;
  count: number;
  points: number;
  weight: number;
}

export interface UseWorkoutsDataParams {
  scale: ScaleType;
  workouts: CompleteWorkoutType[];
  trainingPlan?: TrainingPlanType | null;
}

export type UserSkills = Record<SkillFocusType, number>;
