import type { SkillCode } from "@/schemas/generator.schema";
import type { UserExerciseDataType } from "./UserExerciseData";

/** Stored progress of one exercise. `updatedAt` is in Unix seconds. */
export type ExerciseProgressRecordType = UserExerciseDataType & {
  updatedAt?: number;
};

/** One record per exercise ID, each naming the skill it holds. */
export type ExerciseDataMapType = Record<
  string,
  ExerciseProgressRecordType | undefined
>;

/** Progress records keyed by skill code, then by exercise ID. */
export type ExerciseProgressBySkillType = Partial<
  Record<SkillCode, ExerciseDataMapType>
>;

/**
 * Stored progress a reader sees: the records per skill, and one record per
 * exercise from the skill that wrote it last, which only the legacy generator reads.
 */
export type ExerciseProgressSourceType = {
  exerciseProgress?: ExerciseProgressBySkillType;
  exerciseData: ExerciseDataMapType;
};
