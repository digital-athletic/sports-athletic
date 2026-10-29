import type {
  ExerciseProgressRecordType,
  ExerciseProgressSourceType,
} from "@/features/training/models/ExerciseProgress";
import type { SkillCode } from "@/schemas/generator.schema";

export const toUpdatedAt = (nowMs: number): number => Math.floor(nowMs / 1000);

/**
 * The record of the skill. Without one, the older record per exercise when
 * the skill wrote it last, else null.
 */
export const readOwnExerciseProgress = (
  progress: Readonly<ExerciseProgressSourceType> | null,
  skill: SkillCode,
  exerciseId: string,
): ExerciseProgressRecordType | null => {
  const own = progress?.exerciseProgress?.[skill]?.[exerciseId];
  if (own) return own;
  const older = progress?.exerciseData[exerciseId];
  return older?.skill === skill ? older : null;
};
