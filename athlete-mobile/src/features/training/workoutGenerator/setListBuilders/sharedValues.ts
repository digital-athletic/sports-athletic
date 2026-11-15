/** True when at least one value of `a` is in `b`. An empty list shares nothing. */
export const sharesAnyValue = (
  a: readonly string[],
  b: readonly string[],
): boolean => a.some((value) => b.includes(value));
