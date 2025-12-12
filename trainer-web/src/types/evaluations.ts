export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
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
