import type { IntensityData } from "@/features/training/models/Intensity";
import type {
  ExerciseProgressRecordType,
  ExerciseProgressSourceType,
} from "@/features/training/models/ExerciseProgress";
import type { SkillCode } from "@/schemas/generator.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getWeightType, type WeightType } from "./weightAdjustmentUtils";

type SeedRecord = ExerciseProgressRecordType & { weight: number };

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

const updatedAtOf = (record: ExerciseProgressRecordType): number =>
  record.updatedAt ?? -Infinity;

const hasWeightOfType = (
  record: ExerciseProgressRecordType | undefined,
  weightType: WeightType,
): record is SeedRecord =>
  typeof record?.weight === "number" &&
  (record.weightType ?? "weightAbsolute") === weightType;

/**
 * Newest record with the weight type among the other skills and the older
 * record per exercise; the first one wins a tie, so records per skill win
 * over the older record.
 */
const findNewestSeedRecord = (
  progress: Readonly<ExerciseProgressSourceType> | null,
  skill: SkillCode,
  exerciseId: string,
  weightType: WeightType,
): SeedRecord | null => {
  const candidates = [
    ...Object.entries(progress?.exerciseProgress ?? {}).map(
      ([otherSkill, records]) =>
        otherSkill === skill ? undefined : records?.[exerciseId],
    ),
    progress?.exerciseData[exerciseId],
  ];
  let best: SeedRecord | null = null;
  for (const record of candidates) {
    if (!hasWeightOfType(record, weightType)) continue;
    if (!best || updatedAtOf(record) > updatedAtOf(best)) best = record;
  }
  return best;
};

/**
 * Returns the own record of the skill. Without one, seeds weight and weight
 * type from the newest record of another skill with the expected weight type.
 */
export const readExerciseProgress = (
  progress: Readonly<ExerciseProgressSourceType> | null,
  skill: SkillCode,
  exerciseId: string,
  weightType: WeightType,
): ExerciseProgressRecordType | null => {
  const own = readOwnExerciseProgress(progress, skill, exerciseId);
  if (own) return own;

  const best = findNewestSeedRecord(progress, skill, exerciseId, weightType);
  if (!best) return null;
  return { exerciseId, skill, weight: best.weight, weightType };
};

export const readExpectedWeightType = (
  exercise: ExerciseType,
  intensity: IntensityData | null,
): WeightType =>
  intensity ? getWeightType(exercise, intensity) : "weightAbsolute";
