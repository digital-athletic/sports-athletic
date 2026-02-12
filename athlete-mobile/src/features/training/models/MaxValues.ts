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
  testDate: 0,
  verticalPush: DEFAULT_MAX_VALUE,
  verticalPull: DEFAULT_MAX_VALUE,
  horizontalPush: DEFAULT_MAX_VALUE,
  horizontalPull: DEFAULT_MAX_VALUE,
  hip: DEFAULT_MAX_VALUE,
  knee: DEFAULT_MAX_VALUE,
  lowerBody: DEFAULT_MAX_VALUE,
};

export const EXERCISE_POSITION_VALUES_MAP: (keyof MaxValuesType)[][] = [
  ["horizontalPull"],
  ["horizontalPush"],
  ["knee", "hip", "lowerBody"],
  ["verticalPush", "verticalPull"],
];

export const EXERCISE_DIRECTIONS_VALUES_MAP: Record<
  string,
  Exclude<keyof MaxValuesType, "testDate">
> = {
  VERTICAL_PUSH: "verticalPush",
  VERTICAL_PULL: "verticalPull",
  HORIZONTAL_PUSH: "horizontalPush",
  HORIZONTAL_PULL: "horizontalPull",
  KNEE: "knee",
  HIP: "hip",
  LOWER_BODY: "lowerBody",
};
