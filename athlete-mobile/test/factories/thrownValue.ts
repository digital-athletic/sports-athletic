/**
 * Runs the function and returns the value it throws, or undefined when it
 * returns. The generator throws plain objects, which toThrow does not match.
 *
 * catchThrownValue(() => { throw { type: "NO_EXERCISES" }; }) → { type: "NO_EXERCISES" }
 */
export const catchThrownValue = (run: () => unknown): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
};
