import type { UserExerciseDataType } from "./UserExerciseData";

/** Stored progress of one exercise. `updatedAt` is in Unix seconds. */
export type ExerciseProgressRecordType = UserExerciseDataType & {
  updatedAt?: number;
};

/** Progress records keyed by exercise ID; each record names the skill that wrote it last. */
export type ExerciseProgressMapType = Record<
  string,
  ExerciseProgressRecordType | undefined
>;
