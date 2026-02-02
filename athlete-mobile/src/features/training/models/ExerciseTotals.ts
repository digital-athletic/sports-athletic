/**
 * Exercise Totals Types
 * Tracks cumulative exercise values (weight, duration, reps, height) per exercise.
 */

export type ExerciseTotalsType = {
  weight: number;
  duration: number;
  repetition: number;
  height: number;
};

export type ExerciseTotalsMapType = Record<string, ExerciseTotalsType>;

export const createEmptyExerciseTotals = (): ExerciseTotalsType => ({
  weight: 0,
  duration: 0,
  repetition: 0,
  height: 0,
});

/**
 * Accumulates new values into existing totals, returning a new object.
 * Uses ?? 0 to handle undefined/null values.
 */
export const accumulateExerciseTotals = (
  existing: ExerciseTotalsType | undefined,
  weight?: number,
  duration?: number,
  repetition?: number,
  height?: number,
): ExerciseTotalsType => {
  const base = existing ?? createEmptyExerciseTotals();
  return {
    weight: base.weight + (weight ?? 0),
    duration: base.duration + (duration ?? 0),
    repetition: base.repetition + (repetition ?? 0),
    height: base.height + (height ?? 0),
  };
};
