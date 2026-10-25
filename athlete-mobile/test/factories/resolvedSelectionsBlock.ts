import type { ResolvedBlockTiming } from "@/features/training/workoutGenerator/setListBuilders/blockTiming";
import type { ResolvedSelectionsBlock } from "@/features/training/workoutGenerator/blockHandlers/selections/selectionsBlockResolution";

/**
 * Builds a resolved selections block with the given timing and an empty pool.
 *
 * generateResolvedSelectionsBlock("WU", { sets: 2, superset: "none", rest: {...} })
 * → { skill: "WU", sets: 2, superset: "none", rest: {...}, pool: {}, selections: [], ... }
 */
export const generateResolvedSelectionsBlock = (
  skill: string,
  timing: ResolvedBlockTiming,
): ResolvedSelectionsBlock => ({
  ...timing,
  skill,
  pool: {},
  selections: [],
  countBy: "exercises",
  fallbackToWholeTree: false,
});
