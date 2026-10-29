import type { SkillCode } from "@/schemas/generator.schema";
import type { UserExerciseDataType } from "./UserExerciseData";

/** Stored progress of one exercise. `updatedAt` is in Unix seconds. */
export type ExerciseProgressRecordType = UserExerciseDataType & {
  updatedAt?: number;
};

/** One record per exercise ID; each record names the skill that wrote it last. */
export type ExerciseDataMapType = Record<
  string,
  ExerciseProgressRecordType | undefined
>;

/** Progress records keyed by skill code, then by exercise ID. */
export type ExerciseProgressMapType = Partial<
  Record<SkillCode, ExerciseDataMapType>
>;

/**
 * Stored progress a reader sees: the records per skill and the older record
 * per exercise, which still holds the progress written before the per skill
 * records existed.
 */
export type ExerciseProgressSourceType = {
  exerciseProgress?: ExerciseProgressMapType;
  exerciseData: ExerciseDataMapType;
};
