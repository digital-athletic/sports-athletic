import { GenderTag } from "./Intensity";
import { TrainingLevelType } from "./TrainingLevel";
import { TrainingParameterType } from "./TrainingParameter";

type ValueTypeType = "weightFMax" | "weightAbsolute" | "Unknown" | "Single";

export type ValueType = Partial<
  Record<GenderTag, Partial<Record<TrainingLevelType, string>>>
> & {
  type?: {
    type: ValueTypeType;
  };
};

export type ExerciseValuesType = {
  startValue: ValueType;
  targetValue: ValueType;
};

export type ExerciseValues = Partial<
  Record<TrainingParameterType, ExerciseValuesType>
>;

export type ExerciseType = {
  id: string;
  //TODO remove?
  level: { m: number; w: number };
  name: string;
  displayName: string;
  description: string;
  picture: string;
  video: string;
  values: ExerciseValues;
  tags: string[];
  isAdvanceByReps: boolean;
  isAdvanceByDuration: boolean;
  isJump: boolean;
  otherSideExerciseId?: string;
  equivalentExercises?: string[];
};
