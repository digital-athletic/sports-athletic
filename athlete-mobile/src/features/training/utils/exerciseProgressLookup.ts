import type {
  ExerciseProgressRecordType,
  ExerciseProgressSourceType,
} from "@/features/training/models/ExerciseProgress";
import type { SkillCode } from "@/schemas/generator.schema";

export const toUpdatedAt = (nowMs: number): number => Math.floor(nowMs / 1000);

/** The record the skill wrote for the exercise, else null. */
export const readOwnExerciseProgress = (
  progress: Readonly<ExerciseProgressSourceType> | null,
  skill: SkillCode,
  exerciseId: string,
): ExerciseProgressRecordType | null =>
  progress?.exerciseProgress?.[skill]?.[exerciseId] ?? null;
