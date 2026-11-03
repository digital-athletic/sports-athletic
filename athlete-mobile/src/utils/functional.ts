/** A step that takes a value and returns a value of the same type. */
export type Step<T> = (value: T) => T;

/**
 * Passes the value through the steps from left to right.
 *
 * pipe(3, (n) => n + 1, (n) => n * 2) → 8
 */
export const pipe = <T>(value: T, ...steps: readonly Step<T>[]): T =>
  steps.reduce((current, step) => step(current), value);

/**
 * Returns the step when the condition holds, else a step that returns its input.
 *
 * pipe(3, when(false, (n) => n * 2)) → 3
 */
export const when =
  <T>(condition: boolean, step: Step<T>): Step<T> =>
  (value) =>
    condition ? step(value) : value;
