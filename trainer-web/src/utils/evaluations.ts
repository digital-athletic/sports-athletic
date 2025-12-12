import type { Athlete, AthleteSummary, TimePeriod, WorkoutData } from "../types/evaluations";
import evaluationsData from "../data/evaluations.json";

interface RawWorkout {
  id: string;
  daysAgo: number;
  hours: number;
  minutes: number;
  duration: string;
  exerciseCount: number;
  points: number;
  movedWeight: string;
  trainingPhase: string;
  focus: string;
}

interface RawAthleteSummary {
  workouts: RawWorkout[];
}

function createDate(daysAgo: number, hours: number = 10, minutes: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTimestamp(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

function transformWorkout(raw: RawWorkout): WorkoutData {
  const date = createDate(raw.daysAgo, raw.hours, raw.minutes);
  return {
    id: raw.id,
    date: date.toISOString(),
    timestamp: formatTimestamp(date),
    duration: raw.duration,
    exerciseCount: raw.exerciseCount,
    points: raw.points,
    movedWeight: raw.movedWeight,
    trainingPhase: raw.trainingPhase,
    focus: raw.focus,
  };
}

export function getAthletes(): Athlete[] {
  return evaluationsData.athletes;
}

export function getAthleteWorkouts(): Record<string, AthleteSummary> {
  const result: Record<string, AthleteSummary> = {};

  for (const [athleteId, rawSummary] of Object.entries(evaluationsData.athleteWorkouts)) {
    result[athleteId] = {
      workouts: (rawSummary as RawAthleteSummary).workouts.map(transformWorkout),
    };
  }

  return result;
}

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
  const match = duration.match(/(\d+)\s*min/);
  return match ? parseInt(match[1], 10) : 0;
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }
  return `${minutes} min`;
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
