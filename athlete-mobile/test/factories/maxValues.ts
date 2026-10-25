import {
  DEFAULT_MAX_VALUE,
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";

type MovementPattern = Exclude<keyof MaxValuesType, "testAt">;

/**
 * Builds the tested 1RMs of an athlete from a barbell 1RM per movement
 * pattern. Every other pattern and equipment keeps its default.
 *
 * generateMaxValues({ kneeDominant: 100 })
 * → { ..., kneeDominant: { barbell: 100, dumbbells: undefined, ... }, verticalPush: { barbell: undefined, ... } }
 */
export const generateMaxValues = (
  barbellMaxByPattern: Partial<Record<MovementPattern, number>> = {},
): MaxValuesType => {
  const maxValues = { ...DEFAULT_MAX_VALUES };
  for (const pattern of Object.keys(barbellMaxByPattern) as MovementPattern[]) {
    maxValues[pattern] = {
      ...DEFAULT_MAX_VALUE,
      barbell: barbellMaxByPattern[pattern],
    };
  }
  return maxValues;
};
