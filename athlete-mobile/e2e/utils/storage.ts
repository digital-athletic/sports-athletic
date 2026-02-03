import { expect, type Page } from "@playwright/test";
import type { ExerciseTotalsMapType } from "@/features/training/models/ExerciseTotals";

export const EXERCISE_PROGRESS_STORAGE_KEY = "exercise-progress-storage";
export const COMPLETED_WORKOUTS_STORAGE_KEY = "completed-workouts-storage";

/**
 * Reads exercise totals from localStorage.
 */
export async function getExerciseTotals(
  page: Page,
): Promise<ExerciseTotalsMapType> {
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    EXERCISE_PROGRESS_STORAGE_KEY,
  );

  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.exerciseTotals ?? {};
  } catch {
    return {};
  }
}

/**
 * Reads the full exercise progress storage from localStorage.
 */
export async function getExerciseProgressStorage(page: Page) {
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    EXERCISE_PROGRESS_STORAGE_KEY,
  );

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface WaitOptions {
  timeoutMs?: number;
  minCount?: number;
}

/**
 * Waits for exercise totals to be persisted.
 * Uses Playwright's expect.poll for auto-waiting.
 */
export async function waitForAnyExerciseTotals(
  page: Page,
  options?: WaitOptions,
): Promise<ExerciseTotalsMapType> {
  const { timeoutMs = 5000, minCount = 1 } = options ?? {};

  let totals: ExerciseTotalsMapType = {};

  await expect
    .poll(
      async () => {
        totals = await getExerciseTotals(page);
        return Object.keys(totals).length >= minCount;
      },
      {
        timeout: timeoutMs,
        message: `Expected at least ${minCount} exercise total(s) within ${timeoutMs}ms`,
      },
    )
    .toBe(true);

  return totals;
}

/**
 * Asserts that exercise totals are empty.
 */
export async function expectExerciseTotalsClear(page: Page): Promise<void> {
  const totals = await getExerciseTotals(page);
  expect(Object.keys(totals).length).toBe(0);
}

/**
 * Waits for exercise totals to change from previous values.
 * Useful for verifying accumulation after multiple workouts.
 */
export async function waitForTotalsToChange(
  page: Page,
  previousTotals: ExerciseTotalsMapType,
  options?: { timeoutMs?: number },
): Promise<ExerciseTotalsMapType> {
  const { timeoutMs = 5000 } = options ?? {};

  let totals: ExerciseTotalsMapType = {};

  await expect
    .poll(
      async () => {
        totals = await getExerciseTotals(page);
        // Check if any exercise total has changed
        for (const [id, current] of Object.entries(totals)) {
          const previous = previousTotals[id];
          if (previous) {
            if (
              current.weight !== previous.weight ||
              current.duration !== previous.duration ||
              current.repetition !== previous.repetition ||
              current.height !== previous.height
            ) {
              return true;
            }
          }
        }
        return false;
      },
      {
        timeout: timeoutMs,
        message: `Exercise totals did not change within ${timeoutMs}ms`,
      },
    )
    .toBe(true);

  return totals;
}

/**
 * Completed workout data from the store.
 */
export interface CompletedWorkoutData {
  id: string;
  timestamp: number;
  duration: number;
  xpEarned?: number;
  exercises: Array<{
    exerciseId: string;
    skill?: string;
    weight?: number;
    repetition?: number;
    set?: [number, number];
  }>;
}

/**
 * Reads completed workouts count from localStorage.
 */
export async function getCompletedWorkouts(page: Page): Promise<number> {
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    COMPLETED_WORKOUTS_STORAGE_KEY,
  );

  if (!raw) return 0;

  try {
    const parsed = JSON.parse(raw);
    const workouts = parsed?.state?.workouts ?? {};
    return Object.keys(workouts).length;
  } catch {
    return 0;
  }
}

/**
 * Reads completed workouts data from localStorage.
 */
export async function getCompletedWorkoutsData(
  page: Page,
): Promise<CompletedWorkoutData[]> {
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    COMPLETED_WORKOUTS_STORAGE_KEY,
  );

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const workouts = parsed?.state?.workouts ?? {};
    return Object.values(workouts) as CompletedWorkoutData[];
  } catch {
    return [];
  }
}

/**
 * Calculates statistics totals from completed workouts (matching the hook logic).
 * This mirrors useStatisticsWorkouts transformation for E2E verification.
 */
export function calculateWorkoutStatistics(workouts: CompletedWorkoutData[]): {
  totalDuration: number;
  totalExerciseCount: number;
  totalPoints: number;
  totalWeight: number;
} {
  let totalDuration = 0;
  let totalExerciseCount = 0;
  let totalPoints = 0;
  let totalWeight = 0;

  for (const workout of workouts) {
    totalDuration += workout.duration;
    totalPoints += workout.xpEarned ?? 0;

    // Count exercises (excluding pause and test exercises)
    for (const exercise of workout.exercises) {
      // Skip pause exercise (ID 999999)
      if (exercise.exerciseId === "999999") continue;
      // Skip test exercises
      if (exercise.repetition === -1) continue;
      // Only count last set
      if (exercise.set && exercise.set[0] !== exercise.set[1]) continue;

      totalExerciseCount += 1;

      // Calculate weight
      const weight = exercise.weight ?? 0;
      const reps = exercise.repetition ?? 0;
      const sets = exercise.set ? exercise.set[1] : 1;
      totalWeight += weight * reps * sets;
    }
  }

  return { totalDuration, totalExerciseCount, totalPoints, totalWeight };
}

/**
 * Waits for completed workouts to be persisted.
 */
export async function waitForCompletedWorkouts(
  page: Page,
  options?: { timeoutMs?: number; minCount?: number },
): Promise<number> {
  const { timeoutMs = 5000, minCount = 1 } = options ?? {};

  let count = 0;

  await expect
    .poll(
      async () => {
        count = await getCompletedWorkouts(page);
        return count >= minCount;
      },
      {
        timeout: timeoutMs,
        message: `Expected at least ${minCount} completed workout(s) within ${timeoutMs}ms`,
      },
    )
    .toBe(true);

  return count;
}

/**
 * Waits for completed workouts data to be persisted and returns the data.
 */
export async function waitForCompletedWorkoutsData(
  page: Page,
  options?: { timeoutMs?: number; minCount?: number },
): Promise<CompletedWorkoutData[]> {
  const { timeoutMs = 5000, minCount = 1 } = options ?? {};

  let workouts: CompletedWorkoutData[] = [];

  await expect
    .poll(
      async () => {
        workouts = await getCompletedWorkoutsData(page);
        return workouts.length >= minCount;
      },
      {
        timeout: timeoutMs,
        message: `Expected at least ${minCount} completed workout(s) within ${timeoutMs}ms`,
      },
    )
    .toBe(true);

  return workouts;
}

/**
 * Formats time from seconds to readable string (matching app formatter).
 */
export function formatTimeString(time: number): string {
  if (time < 60) {
    return `${time} s`;
  }
  if (time < 3600) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }
  const hours = Math.floor(time / 3600);
  const timeLeft = time - hours * 3600;
  const minutes = Math.floor(timeLeft / 60);
  return `${hours} h ${minutes} min`;
}

/**
 * Parses formatted time string back to seconds.
 * Inverse of formatTimeString().
 *
 * @example
 * parseTimeString("5 min 30 s") // => 330
 * parseTimeString("1 h 30 min") // => 5400
 * parseTimeString("45 s")       // => 45
 * parseTimeString("0 s")        // => 0
 */
export function parseTimeString(text: string): number {
  const trimmed = text.trim();

  if (trimmed === "0 s" || trimmed === "0 min" || trimmed === "0") {
    return 0;
  }

  let totalSeconds = 0;

  // Extract hours
  const hoursMatch = trimmed.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  }

  // Extract minutes
  const minsMatch = trimmed.match(/(\d+)\s*min/);
  if (minsMatch) {
    totalSeconds += parseInt(minsMatch[1], 10) * 60;
  }

  // Extract seconds (must end with 's' but not be part of "min")
  const secsMatch = trimmed.match(/(\d+)\s*s$/);
  if (secsMatch) {
    totalSeconds += parseInt(secsMatch[1], 10);
  }

  return totalSeconds;
}

/**
 * Formats weight to readable string (matching app formatter).
 */
export function formatWeightString(weight: number): string {
  return weight < 1000
    ? `${Math.round(weight)} kg`
    : `${(weight / 1000).toFixed(2)} t`;
}

/**
 * Parses formatted weight string back to kilograms.
 * Inverse of formatWeightString().
 *
 * @example
 * parseWeightString("500 kg") // => 500
 * parseWeightString("1.25 t") // => 1250
 * parseWeightString("0 kg")   // => 0
 */
export function parseWeightString(text: string): number {
  const trimmed = text.trim();

  if (trimmed === "0 kg" || trimmed === "0") {
    return 0;
  }

  // Handle tons (converts to kg for comparison consistency)
  if (trimmed.includes("t")) {
    const tonsMatch = trimmed.match(/([\d.]+)\s*t/);
    return tonsMatch ? parseFloat(tonsMatch[1]) * 1000 : 0;
  }

  // Handle kilograms
  const kgMatch = trimmed.match(/([\d.]+)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]);
  }

  // Fallback: try to parse as plain number
  const numMatch = trimmed.match(/^([\d.]+)/);
  return numMatch ? parseFloat(numMatch[1]) : 0;
}
