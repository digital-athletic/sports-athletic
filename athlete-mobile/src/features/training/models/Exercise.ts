type ValueTypeType = "weightFMax" | "weightAbsolute" | "Unknown" | "Single";

type ValueType = {
  default: { [key: string]: string };
  m: { [key: string]: string };
  w: { [key: string]: string };
  k: { [key: string]: string };
  type?: {
    type: ValueTypeType;
  };
};

type ExerciseValuesType = {
  startValue: ValueType;
  targetValue: ValueType;
};

export type ExerciseType = {
  id: number;
  //TODO remove?
  level: { m: number; w: number };
  name: string;
  displayName: string;
  description: string;
  picture: string;
  video: string;
  values: {
    duration: ExerciseValuesType;
    height: ExerciseValuesType;
    repetition: ExerciseValuesType;
    weight: ExerciseValuesType;
  };
  tags: string[];
  isAdvanceByReps: boolean;
  isAdvanceByDuration: boolean;
  isJump: boolean;
  otherSideExerciseId?: number;
  equivalentExercises?: number[];
};
