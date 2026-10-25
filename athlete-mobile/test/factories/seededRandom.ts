/**
 * Builds a random source from a seed (mulberry32): the same seed returns the
 * same values in [0, 1), however often the code draws.
 *
 * const random = generateSeededRandom(7);
 * random() → 0.0117..., random() → 0.0619..., ... on every run
 */
export const generateSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};
