import type {
  TimePeriod,
  UserCompletedWorkout,
  WorkoutData,
} from "../types/evaluations";

export function getDateThreshold(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case "lastWeek":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "lastMonth":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "lastYear":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0);
  }
}

export function parseDuration(duration: string): number {
  // Handle "X h Y min" format
  const hoursMatch = duration.match(/(\d+)\s*h/);
  const minutesMatch = duration.match(/(\d+)\s*min/);

  let totalMinutes = 0;
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }

  return totalMinutes;
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }
  return `${minutes} min`;
}

export function formatDurationFromSeconds(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return formatDuration(minutes);
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    const tonnes = Math.floor(kg / 1000);
    const remaining = Math.round(kg % 1000);
    if (remaining > 0) {
      return `${tonnes} t ${remaining} kg`;
    }
    return `${tonnes} t`;
  }
  return `${Math.round(kg)} kg`;
}

export function formatTimestamp(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

export function getTrainingPhaseLabel(trainingType: string | null): string {
  const typeMap: Record<string, string> = {
    PLAN: "Trainingsplan",
    QUICK: "Schnelltraining",
    PREV: "Prävention",
  };
  return trainingType ? typeMap[trainingType] || trainingType : "-";
}

export function getFocusLabel(trainingFocus: string | null): string {
  const focusMap: Record<string, string> = {
    STABILITY: "Stabilität",
    GKS: "Ganzkörper",
    PREVSHOULDER: "Schulter",
    PREVKNEE: "Knie",
    PREVHIP: "Hüfte",
    PREVBACK: "Rücken",
  };
  return trainingFocus ? focusMap[trainingFocus] || trainingFocus : "-";
}

export function transformWorkout(workout: UserCompletedWorkout): WorkoutData {
  const date = new Date(workout.workout_date);
  return {
    id: workout.id,
    date: date.toISOString(),
    timestamp: formatTimestamp(date),
    duration: formatDurationFromSeconds(workout.duration),
    exerciseCount: workout.exercise_count,
    points: workout.points,
    movedWeight: formatWeight(workout.moved_weight),
    trainingPhase: getTrainingPhaseLabel(workout.training_type),
    focus: getFocusLabel(workout.training_focus),
  };
}

export function filterWorkoutsByPeriod(
  workouts: WorkoutData[],
  period: TimePeriod
): WorkoutData[] {
  const threshold = getDateThreshold(period);
  return workouts.filter((w) => new Date(w.date) >= threshold);
}

export function calculateSummaryStats(workouts: WorkoutData[]) {
  const totalMinutes = workouts.reduce(
    (sum, w) => sum + parseDuration(w.duration),
    0
  );
  const totalPoints = workouts.reduce((sum, w) => sum + w.points, 0);

  return {
    totalDuration: formatDuration(totalMinutes),
    trainingCount: workouts.length,
    totalPoints,
  };
}
