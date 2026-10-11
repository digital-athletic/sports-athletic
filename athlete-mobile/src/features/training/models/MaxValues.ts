import { type MaxValueType, type MaxValuesType } from "@/schemas/user.schema";

// Re-export types from schema - single source of truth
export type { MaxValueType, MaxValuesType };

export const DEFAULT_MAX_VALUE: MaxValueType = {
  barbell: undefined,
  dumbbells: undefined,
  oneSidedUpper: undefined,
  oneSidedLower: undefined,
  oneSidedLowerSupported: undefined,
};

export const DEFAULT_MAX_VALUES: MaxValuesType = {
  testAt: 0,
  verticalPush: DEFAULT_MAX_VALUE,
  verticalPull: DEFAULT_MAX_VALUE,
  horizontalPush: DEFAULT_MAX_VALUE,
  horizontalPull: DEFAULT_MAX_VALUE,
  hipHinge: DEFAULT_MAX_VALUE,
  kneeDominant: DEFAULT_MAX_VALUE,
  lowerBody: DEFAULT_MAX_VALUE,
};

export const EXERCISE_POSITION_VALUES_MAP: (keyof MaxValuesType)[][] = [
  ["horizontalPull"],
  ["horizontalPush"],
  ["kneeDominant", "hipHinge", "lowerBody"],
  ["verticalPush", "verticalPull"],
];

export const EXERCISE_DIRECTIONS_VALUES_MAP: Record<
  string,
  Exclude<keyof MaxValuesType, "testAt">
> = {
  VERTICAL_PUSH: "verticalPush",
  HORIZONTAL_PUSH: "horizontalPush",
  HORIZONTAL_PULL: "horizontalPull",
  KNEE: "kneeDominant",
  HIP: "hipHinge",
};
