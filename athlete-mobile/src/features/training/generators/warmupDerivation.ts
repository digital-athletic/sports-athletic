export const WARMUP_WEIGHT_PERCENTAGES = [50, 75] as const;

export const WARMUP_REST_SECONDS = 60 as const;

/** Rounding happens in percentage space, not in kg space. */
export const computeWarmupTrainingWeights = (
  firstWorkingTrainingWeight: number,
): number[] =>
  WARMUP_WEIGHT_PERCENTAGES.map((w) =>
    Math.floor((w / 100) * firstWorkingTrainingWeight),
  );
