import * as v from "valibot";
import { GeneratorSkillTypeSchema, SetTupleSchema } from "./generator.schema";

// ExerciseDifficulty: null | "TOO_HARD" | "TOO_EASY" | "SUCCEEDED"
export const ExerciseDifficultySchema = v.nullable(
  v.picklist(["TOO_HARD", "TOO_EASY", "SUCCEEDED"]),
);

export const MaxForceRepetitionsDataSchema = v.object({
  level: v.picklist(["WARMUP", "EASY", "MEDIUM", "HARD"]),
  repetitions: v.number(),
});
export type MaxForceRepetitionsDataType = v.InferOutput<
  typeof MaxForceRepetitionsDataSchema
>;

export const UserExerciseDataSchema = v.looseObject({
  exerciseId: v.string(),
  repetition: v.optional(v.number()),
  weight: v.optional(v.number()),
  nextWeightPercentage: v.optional(v.number()),
  maxFRepetitions: v.optional(v.array(MaxForceRepetitionsDataSchema)),
  maxFLevelAdjustment: v.optional(ExerciseDifficultySchema),
  duration: v.optional(v.number()),
  height: v.optional(v.number()),
  weightType: v.optional(v.string()),
  skipped: v.optional(v.boolean()),
  set: v.optional(SetTupleSchema),
  skill: GeneratorSkillTypeSchema,
  feedback: v.optional(
    v.object({
      difficulty: ExerciseDifficultySchema,
      streakCounter: v.optional(v.number()),
    }),
  ),
  branchId: v.optional(v.string()),
});
export type UserExerciseDataType = v.InferOutput<typeof UserExerciseDataSchema>;

// FocusArea values reuse FocusTypeSchema values but add SWR and WARMUP
export const FocusAreaSchema = v.picklist([
  "PREVENTION",
  "MOBILITY",
  "SWR",
  "WARMUP",
  "STABILITY",
  "CARDIO",
]);
export type FocusArea = v.InferOutput<typeof FocusAreaSchema>;

export const CompleteWorkoutSchema = v.looseObject({
  id: v.string(),
  timestamp: v.number(),
  exercises: v.array(UserExerciseDataSchema),
  duration: v.number(),
  xpEarned: v.optional(v.number()),
  movedWeight: v.optional(v.number()),
  exerciseCount: v.optional(v.number()),
  userSkills: v.optional(v.record(v.string(), v.number())),
});
export type CompleteWorkoutType = v.InferOutput<typeof CompleteWorkoutSchema>;
