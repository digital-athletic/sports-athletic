import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import { AdjustmentParameterType } from "./AdjustmentParameter";
import { TrainingLevelType } from "./TrainingLevel";
import { TrainingParameterType } from "./TrainingParameter";

export type AdjustmentValue = Record<
  Exclude<ExerciseDifficultyType, null>,
  number
>;

export type AdjustmentLevel = Partial<
  Record<TrainingLevelType, AdjustmentValue>
>;

const genderTags = ["default", "m", "w", "k"] as const;

export type GenderTag = (typeof genderTags)[number];

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
  adjustment: IntensityAdjustment;
  startValue: IntensityValueType;
  targetValue: IntensityValueType;
};
