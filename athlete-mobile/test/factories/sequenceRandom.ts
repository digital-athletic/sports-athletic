/**
 * Builds a random source that returns the given values in order and throws once
 * they run out, so a spec also fixes how often the code draws.
 *
 * const random = generateSequenceRandom([0.5, 0.1]);
 * random() → 0.5, random() → 0.1, random() → throws
 */
export const generateSequenceRandom = (values: number[]): (() => number) => {
  const remaining = [...values];
  return () => {
    const value = remaining.shift();
    if (value === undefined) {
      throw new Error("The sequence random has no values left");
    }
    return value;
  };
};
