import { MaxValueType } from "./MaxValue";

export type MaxValuesType = {
  testDate: string; // DD-MM-YYYY
  // one field for each of WorkoutConstants.EXERCISE_DIRECTIONS
  verticalPush: MaxValueType;
  verticalPull: MaxValueType; // same as verticalPush
  horizontalPush: MaxValueType;
  horizontalPull: MaxValueType;
  hip: MaxValueType; // same as unterkoerper
  knee: MaxValueType; // same as unterkoerper
  unterkoerper: MaxValueType;
};

export const DEFAULT_MAX_VALUE: MaxValueType = {
  barbell: undefined,
  dumbbells: undefined,
  oneSidedUpper: undefined,
  oneSidedLower: undefined,
  oneSidedLowerSupported: undefined,
};

export const DEFAULT_MAX_VALUES: MaxValuesType = {
  testDate: "01-01-1990",
  verticalPush: DEFAULT_MAX_VALUE,
  verticalPull: DEFAULT_MAX_VALUE,
  horizontalPush: DEFAULT_MAX_VALUE,
  horizontalPull: DEFAULT_MAX_VALUE,
  hip: DEFAULT_MAX_VALUE,
  knee: DEFAULT_MAX_VALUE,
  unterkoerper: DEFAULT_MAX_VALUE,
};

export const EXERCISE_POSITION_VALUES_MAP: (keyof MaxValuesType)[][] = [
  ["horizontalPull"],
  ["horizontalPush"],
  ["knee", "hip", "unterkoerper"],
  ["verticalPush", "verticalPull"],
];

export const EXERCISE_DIRECTIONS_VALUES_MAP: Record<
  string,
  keyof MaxValuesType
> = {
  VERTICAL_PUSH: "verticalPush",
  VERTICAL_PULL: "verticalPull",
  HORIZONTAL_PUSH: "horizontalPush",
  HORIZONTAL_PULL: "horizontalPull",
  KNEE: "knee",
  HIP: "hip",
  UNTERKOERPER: "unterkoerper",
};
