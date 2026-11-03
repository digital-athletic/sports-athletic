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

/**
 * Maps the items in order and passes a state from item to item, as Elixir's
 * Enum.map_reduce does. Returns the mapped items and the final state.
 *
 * mapReduce([1, 2, 3], 0, (n, sum) => [sum + n, sum + n]) → [[1, 3, 6], 6]
 */
export const mapReduce = <T, R, S>(
  items: readonly T[],
  initial: S,
  step: (item: T, state: S) => readonly [R, S],
): [R[], S] =>
  items.reduce<[R[], S]>(
    ([results, state], item) => {
      const [result, nextState] = step(item, state);
      return [[...results, result], nextState];
    },
    [[], initial],
  );

/**
 * Keeps the entries of a record whose value passes the check, as Elixir's
 * Map.filter does.
 *
 * filterRecord({ a: 1, b: 2 }, (value) => value > 1) → { b: 2 }
 */
export const filterRecord = <T>(
  record: Readonly<Record<string, T>>,
  isKept: (value: T, key: string) => boolean,
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).filter(([key, value]) => isKept(value, key)),
  );
