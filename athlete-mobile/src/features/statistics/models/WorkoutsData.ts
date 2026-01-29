import { SkillFocusType } from "@/features/training/models/Training";
import { type TrainingPlanType } from "@/features/training/models/TrainingPlan";

export type ScaleType = "week" | "month" | "year" | "total";

export interface WorkoutsListEntry {
  workoutId: string;
  date: number;
  /** Duration in seconds */
  duration: number;
  exerciseCount: number;
  points: number;
  movedWeight: number;
  userSkills: Record<SkillFocusType, number>;
  userSkillsDuration?: Record<SkillFocusType, number>;
  exercises?: unknown[];
  time?: number;
}

export interface WorkoutsSummary {
  /** Total duration in seconds */
  duration: number;
  count: number;
  points: number;
  weight: number;
}

export interface UseWorkoutsDataParams {
  scale: ScaleType;
  workoutsList: WorkoutsListEntry[];
  trainingPlan?: TrainingPlanType | null;
}

export type UserSkills = Record<SkillFocusType, number>;
