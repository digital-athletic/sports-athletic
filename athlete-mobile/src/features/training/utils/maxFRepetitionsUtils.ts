import type { SkillCode } from "@/schemas/generator.schema";
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

/**
 * Working set entries of a max strength exercise in set order, one per set,
 * so the next session can continue every set on its own ladder.
 */
export const getWorkingSetMaxFReps = (
  exerciseList: {
    exerciseId: string;
    skill?: SkillCode;
    maxFRepetitions?: MaxForceRepetitionsDataType[];
  }[],
  exerciseId: string,
  skill: SkillCode,
): MaxForceRepetitionsDataType[] =>
  exerciseList
    .filter((entry) => entry.exerciseId === exerciseId && entry.skill === skill)
    .flatMap((entry) => entry.maxFRepetitions ?? [])
    .filter((entry) => entry.level !== "WARMUP");
