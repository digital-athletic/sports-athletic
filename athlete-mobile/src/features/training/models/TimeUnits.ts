/**
 * Branded types for time units to prevent mixing seconds and minutes.
 *
 * Usage:
 * - Use `DurationMinutes` when the value represents time in minutes (e.g., TrainingDay.duration)
 * - Use `DurationSeconds` when the value represents time in seconds (e.g., CompleteWorkout.duration)
 * - Use the helper functions to convert between units safely
 */

/** Brand for duration values in minutes */
declare const _minutes: unique symbol;
export type DurationMinutes = number & { readonly [_minutes]: true };

/** Brand for duration values in seconds */
declare const _seconds: unique symbol;
export type DurationSeconds = number & { readonly [_seconds]: true };

/** Create a DurationMinutes value from a raw number */
export const minutes = (value: number): DurationMinutes =>
  value as DurationMinutes;

/** Create a DurationSeconds value from a raw number */
export const seconds = (value: number): DurationSeconds =>
  value as DurationSeconds;

/** Convert minutes to seconds */
export const minutesToSeconds = (mins: DurationMinutes): DurationSeconds =>
  (mins * 60) as DurationSeconds;

/** Convert seconds to minutes (rounds down) */
export const secondsToMinutes = (secs: DurationSeconds): DurationMinutes =>
  Math.floor(secs / 60) as DurationMinutes;

/** Get the raw number value from a DurationMinutes */
export const rawMinutes = (mins: DurationMinutes): number => mins;

/** Get the raw number value from a DurationSeconds */
export const rawSeconds = (secs: DurationSeconds): number => secs;
