import { expect, type Page } from "@playwright/test";
import type { ExerciseTotalsMapType } from "@/features/training/models/ExerciseTotals";

export const EXERCISE_PROGRESS_STORAGE_KEY = "exercise-progress-storage";

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
