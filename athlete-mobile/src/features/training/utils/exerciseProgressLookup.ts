import type { IntensityData } from "@/features/training/models/Intensity";
import type {
  ExerciseProgressMapType,
  ExerciseProgressRecordType,
} from "@/features/training/models/ExerciseProgress";
import type { SkillCode } from "@/schemas/generator.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getWeightType, type WeightType } from "./weightAdjustmentUtils";

export const toUpdatedAt = (nowMs: number): number => Math.floor(nowMs / 1000);

/** The stored record of the exercise when the skill wrote it last, else null. */
export const readOwnExerciseProgress = (
  progress: Readonly<ExerciseProgressMapType> | null,
  skill: SkillCode,
  exerciseId: string,
): ExerciseProgressRecordType | null => {
  const record = progress?.[exerciseId];
  return record?.skill === skill ? record : null;
};

/**
 * Returns the own record of the skill. Without one, seeds weight and weight
 * type from the record another skill wrote, when its weight type matches.
 */
export const readExerciseProgress = (
  progress: Readonly<ExerciseProgressMapType> | null,
  skill: SkillCode,
  exerciseId: string,
  weightType: WeightType,
): ExerciseProgressRecordType | null => {
  const own = readOwnExerciseProgress(progress, skill, exerciseId);
  if (own) return own;

  const other = progress?.[exerciseId];
  const otherWeightType = other?.weightType ?? "weightAbsolute";
  if (typeof other?.weight !== "number" || otherWeightType !== weightType) {
    return null;
  }
  return { exerciseId, skill, weight: other.weight, weightType };
};

export const readExpectedWeightType = (
  exercise: ExerciseType,
  intensity: IntensityData | null,
): WeightType =>
  intensity ? getWeightType(exercise, intensity) : "weightAbsolute";
