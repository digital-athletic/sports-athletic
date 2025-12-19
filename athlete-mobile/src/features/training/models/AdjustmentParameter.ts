const adjustmentParameters = [
  "duration",
  "height",
  "repetition",
  "weight",
  "weightFMax",
  "weightAbsolute",
] as const;

export type AdjustmentParameterType = (typeof adjustmentParameters)[number];

export const isAdjustmentParameter = (
  value: unknown,
): value is AdjustmentParameterType =>
  typeof value === "string" &&
  adjustmentParameters.includes(value as AdjustmentParameterType);
