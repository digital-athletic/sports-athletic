import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";

/**
 * Safely retrieves the last entry from maxFRepetitions.
 * Returns undefined when the array is undefined or empty,
 * preventing the TypeError that occurred when accessing
 * maxFRepetitions[length-1].level on an empty array.
 */
export const getLastMaxFRep = (
  maxFRepetitions: MaxForceRepetitionsDataType[] | undefined,
): MaxForceRepetitionsDataType | undefined => {
  const arr = maxFRepetitions ?? [];
  return arr.length > 0 ? arr[arr.length - 1] : undefined;
};
