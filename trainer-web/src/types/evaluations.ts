export interface Athlete {
  id: string;
  displayName: string;
}

export interface WorkoutData {
  id: string;
  timestamp: string;
  date: string;
  duration: string;
  exerciseCount: number;
  points: number;
  movedWeight: string;
  trainingPhase: string;
  focus: string;
}

export interface AthleteSummary {
  workouts: WorkoutData[];
}

export interface SummaryStats {
  totalDuration: string;
  trainingCount: number;
  totalPoints: number;
}

export type TimePeriod = "lastWeek" | "lastMonth" | "lastYear" | "total";

export interface UserCompletedWorkout {
  id: string;
  user_id: string;
  workout_id: string;
  workout_date: number;
  duration: number;
  exercise_count: number;
  points: number;
  moved_weight: number;
  training_type: string | null;
  training_focus: string | null;
  created_at: string;
}
