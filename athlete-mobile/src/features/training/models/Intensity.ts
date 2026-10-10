import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import {
  type GenderTagType,
  type TrainingLevelType,
  type TrainingParameterType,
} from "@/schemas/common.schema";
import { AdjustmentParameterType } from "./AdjustmentParameter";

export type AdjustmentValue = Record<
  Exclude<ExerciseDifficultyType, null>,
  number
>;

export type AdjustmentLevel = Partial<
  Record<TrainingLevelType, AdjustmentValue>
>;

export type GenderTag = GenderTagType;

const genderTags: GenderTag[] = ["default", "m", "w", "k"];

export const isGenderTag = (value: unknown): value is GenderTag => {
  return typeof value === "string" && genderTags.includes(value as GenderTag);
};

type AdjustmentCategory = Partial<Record<GenderTag, AdjustmentLevel>>;

type IntensityAdjustment = Partial<
  Record<AdjustmentParameterType, AdjustmentCategory>
>;

export type IntensityValueType = Partial<
  Record<
    TrainingParameterType,
    Partial<
      Record<GenderTag, Partial<Record<TrainingLevelType, number>>> & {
        type?: { type: "weightFMax" | "weightAbsolute" | "Unknown" | "Single" };
      }
    >
  >
>;

export type IntensityData = {
  /** Repetition and duration start/target of this config win over exercise values. */
  overridesExerciseRepsAndDuration?: boolean;
  adjustment: IntensityAdjustment;
  startValue: IntensityValueType;
  targetValue: IntensityValueType;
};
