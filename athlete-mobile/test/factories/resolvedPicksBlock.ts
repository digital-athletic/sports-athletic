import type { ResolvedBlockTiming } from "@/features/training/workoutGenerator/blockTiming";
import type { ResolvedPicksBlock } from "@/features/training/workoutGenerator/picksBlockResolution";

/**
 * Builds a resolved picks block with the given timing and an empty pool.
 *
 * generateResolvedPicksBlock("WU", { sets: 2, superset: "none", rest: {...} })
 * → { skill: "WU", sets: 2, superset: "none", rest: {...}, pool: {}, picks: [], ... }
 */
export const generateResolvedPicksBlock = (
  skill: string,
  timing: ResolvedBlockTiming,
): ResolvedPicksBlock => ({
  ...timing,
  skill,
  pool: {},
  picks: [],
  countBy: "exercises",
  fallbackToWholeTree: false,
});
