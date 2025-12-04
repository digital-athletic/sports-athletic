import { type SkillType } from "@/features/training/models/Training";
import { type TrainingPlanType } from "@/features/training/models/TrainingPlan";

export type ScaleType = "week" | "month" | "year" | "total";

export interface WorkoutsListEntry {
  workoutId: string;
  date: number;
  duration: number;
  exerciseCount: number;
  points: number;
  movedWeight: number;
  userSkills: Record<SkillType, number>;
  userSkillsDuration?: Record<SkillType, number>;
  exercises?: unknown[];
  time?: number;
}

export interface WorkoutsSummary {
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

export type UserSkills = Record<SkillType, number>;
