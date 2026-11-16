import { type SportTest } from "./models/SportTest";

/**
 * The strength test exercise of each performance test code, e.g. BENCH_PRESS is the barbell bench press "342".
 * The ids are the lifts of the bundled strength test.
 */
export const STRENGTH_TEST_EXERCISE_IDS: Readonly<Record<string, string>> = {
  SQUAT: "25",
  DEADLIFT: "50",
  BENCH_PRESS: "342",
  ROW: "297",
  SHOULDER_PRESS: "54",
};

/** Upper case without spaces, hyphens or underscores, e.g. "bench-press" becomes "BENCHPRESS". */
const normalizeCode = (code: string): string =>
  code.replace(/[\s_-]/g, "").toUpperCase();

const EXERCISE_ID_BY_NORMALIZED_CODE = new Map(
  Object.entries(STRENGTH_TEST_EXERCISE_IDS).map(([code, exerciseId]) => [
    normalizeCode(code),
    exerciseId,
  ]),
);

/** The strength test exercise of the performance test, null when the test is no strength test. */
export function strengthTestExerciseId(test: SportTest): string | null {
  return EXERCISE_ID_BY_NORMALIZED_CODE.get(normalizeCode(test.code)) ?? null;
}

/** The lifted weight as a multiple of the body weight, rounded to two decimals, e.g. 90 kg at 60 kg is 1.5. */
export function relativeOneRepMax(
  liftedWeightKg: number,
  bodyWeightKg: number,
): number {
  return Math.round((liftedWeightKg / bodyWeightKg) * 100) / 100;
}

/** The body weight to calculate the value with, null when the athlete enters the value directly. */
export function entryBodyWeight(
  test: SportTest,
  bodyWeightKg: number | undefined,
): number | null {
  if (strengthTestExerciseId(test) === null) return null;
  if (bodyWeightKg === undefined) return null;
  if (!Number.isFinite(bodyWeightKg) || bodyWeightKg <= 0) return null;

  return bodyWeightKg;
}
