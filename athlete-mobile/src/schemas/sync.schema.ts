import * as v from "valibot";
import { SetTupleSchema, SkillCodeSchema } from "./generator.schema";

// ExerciseDifficulty: null | "TOO_HARD" | "TOO_EASY" | "SUCCEEDED"
export const ExerciseDifficultySchema = v.nullable(
  v.picklist(["TOO_HARD", "TOO_EASY", "SUCCEEDED"]),
);

export const MaxForceRepetitionsDataSchema = v.object({
  level: v.picklist(["WARMUP", "EASY", "MEDIUM", "HARD"]),
  repetitions: v.number(),
  /** Percentage of F-Max of the working set; missing in entries stored before per set ladders. */
  weightPercentage: v.optional(v.number()),
});
export type MaxForceRepetitionsDataType = v.InferOutput<
  typeof MaxForceRepetitionsDataSchema
>;

export const UserExerciseDataSchema = v.looseObject({
  exerciseId: v.string(),
  workoutId: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  /** Index of the entry in the workout list; keys the row on the server. */
  position: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1000)),
  ),
  repetition: v.optional(v.number()),
  weight: v.optional(v.number()),
  /** Consecutive too hard ratings; a session without a rating leaves it unchanged. */
  tooHardCount: v.optional(v.number()),
  nextWeightPercentage: v.optional(v.number()),
  maxFRepetitions: v.optional(v.array(MaxForceRepetitionsDataSchema)),
  maxFLevelAdjustment: v.optional(ExerciseDifficultySchema),
  duration: v.optional(v.number()),
  height: v.optional(v.number()),
  weightType: v.optional(v.string()),
  skipped: v.optional(v.boolean()),
  completed: v.optional(v.boolean()),
  set: v.optional(SetTupleSchema),
  skill: SkillCodeSchema,
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

export const TrainingViewModeSchema = v.picklist(["SEQUENTIAL", "LIST"]);
export type TrainingViewMode = v.InferOutput<typeof TrainingViewModeSchema>;

export const CompleteWorkoutSchema = v.looseObject({
  id: v.string(),
  timestamp: v.number(),
  exercises: v.array(UserExerciseDataSchema),
  duration: v.number(),
  xpEarned: v.optional(v.number()),
  movedWeight: v.optional(v.number()),
  exerciseCount: v.optional(v.number()),
  userSkills: v.optional(v.record(v.string(), v.number())),
  /**
   * View the workout started in; missing in workouts stored before it was recorded.
   * An unknown view from a newer app version becomes null so the workout still syncs.
   */
  viewMode: v.fallback(v.nullish(TrainingViewModeSchema), null),
});
export type CompleteWorkoutType = v.InferOutput<typeof CompleteWorkoutSchema>;
