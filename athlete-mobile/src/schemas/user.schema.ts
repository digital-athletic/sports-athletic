/**
 * User Schema Definitions
 *
 * DUAL TYPE SYSTEM NOTE:
 * This codebase has two parallel type systems that require type casts at boundaries:
 *
 * 1. Schema Types (this file): Inferred from valibot schemas using v.InferOutput<>.
 *    These use generic Record<string, ...> for flexibility during validation.
 *
 * 2. Model Types (src/features/training/models/): Manually defined TypeScript types
 *    like UserTrainingType and TrainingType with explicit property keys.
 *
 * Example mismatch:
 * - Schema: UserTrainingSchema.skills is Record<string, ExerciseBranchEntry[]>
 * - Model: UserTrainingType.skills has explicit keys like { BR?: ..., MOB?: ..., ... }
 *
 * This structural difference means code consuming schema-validated data often needs
 * casts like `currSec.trainings as UserTrainingType[]` when passing to functions
 * expecting model types.
 *
 * Future improvement: Align model types to re-export from schemas, or use branded
 * types to make the conversion explicit and type-safe.
 */

import * as v from "valibot";
import {
  CardioTypesSchema,
  SectionTypesSchema,
  SeasonPhaseEnumSchema,
} from "./common.schema";

// FocusType schema (matches FocusType from workoutConstants.ts)
export const FocusTypeSchema = v.picklist([
  "PHASE",
  "CARDIO",
  "STABILITY",
  "COMBINED",
]);

// MaxValue schema - single source of truth for max weight values
export const MaxValueSchema = v.object({
  barbell: v.optional(v.number()),
  dumbbells: v.optional(v.number()),
  oneSidedUpper: v.optional(v.number()),
  oneSidedBarbell: v.optional(v.number()),
  oneSidedLower: v.optional(v.number()),
  oneSidedLowerSupported: v.optional(v.number()),
});
export type MaxValueType = v.InferOutput<typeof MaxValueSchema>;

// MaxValues schema - single source of truth for all max values by direction
export const MaxValuesSchema = v.object({
  testDate: v.string(),
  verticalPush: MaxValueSchema,
  verticalPull: MaxValueSchema,
  horizontalPush: MaxValueSchema,
  horizontalPull: MaxValueSchema,
  hip: MaxValueSchema,
  knee: MaxValueSchema,
  unterkoerper: MaxValueSchema,
});
export type MaxValuesType = v.InferOutput<typeof MaxValuesSchema>;

// Exercise branch entry schema for UserTraining skills
export const UserTrainingExerciseBranchSchema = v.looseObject({
  exerciseBranchId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  exercises: v.optional(
    v.record(
      v.string(),
      v.looseObject({
        exerciseId: v.optional(v.string()),
        id: v.optional(v.string()),
      }),
    ),
  ),
  levels: v.optional(
    v.record(
      v.string(),
      v.looseObject({
        exerciseId: v.optional(v.string()),
        id: v.optional(v.string()),
      }),
    ),
  ),
});

// UserTraining schema (matches UserTrainingType)
export const UserTrainingSchema = v.looseObject({
  weekday: v.number(),
  skills: v.optional(
    v.record(v.string(), v.array(UserTrainingExerciseBranchSchema)),
  ),
  lengths: v.optional(v.record(v.string(), v.number())),
  focus: v.optional(FocusTypeSchema),
});

export const SeasonPhaseSchema = v.object({
  type: v.union([SeasonPhaseEnumSchema, v.null()]),
  numOfWeeks: v.optional(v.number()),
  endDate: v.string(),
});

export type SeasonPhaseSchemaType = v.InferOutput<typeof SeasonPhaseSchema>;

export const WorkoutDataSchema = v.looseObject({
  gender: v.optional(v.picklist(["MALE", "FEMALE"])),
  anamnesisCompleted: v.optional(v.boolean()),
  seasonPhase: v.optional(SeasonPhaseSchema),
  birthday: v.optional(v.string()), // DD-MM-YYYY format
  tags: v.optional(v.array(v.string())),
  maxValues: v.optional(MaxValuesSchema),
});

export const TemporalDataSchema = v.object({
  date: v.union([v.date(), v.string()]),
  expiration: v.union([v.date(), v.string()]),
  tag: v.string(),
});

export const TrainingSectionSchema = v.looseObject({
  start: v.string(),
  numOfWeeks: v.number(),
  type: SectionTypesSchema,
  cardioType: CardioTypesSchema,
  trainings: v.array(UserTrainingSchema),
});

export const TrainingPlanSchema = v.object({
  start: v.union([v.date(), v.string()]),
  sections: v.array(TrainingSectionSchema),
});

export const ReviewStatusSchema = v.object({
  hasGivenReview: v.boolean(),
  reviewDate: v.number(),
  reviewYears: v.number(),
  reviewSkips: v.number(),
});

export const UserSettingsSchema = v.object({
  anonymisedDataUse: v.boolean(),
  reviewStatus: ReviewStatusSchema,
});

export const StatisticsTotalsSchema = v.object({
  reps: v.number(),
  weight: v.number(),
  time: v.number(),
});

export const UserStatisticsSchema = v.object({
  totals: StatisticsTotalsSchema,
  lastWeek: StatisticsTotalsSchema,
});

export const UserTypeSchema = v.looseObject({
  userId: v.string(),
  isInInitialAnamnesis: v.optional(v.boolean()),
  workoutData: v.optional(WorkoutDataSchema),
  temporalData: v.optional(v.array(TemporalDataSchema)),
  trainingPlan: v.optional(v.union([TrainingPlanSchema, v.null()])),
  settings: v.optional(UserSettingsSchema),
  statistics: v.optional(UserStatisticsSchema),
  teamId: v.optional(v.string()),
});

export type UserType = v.InferOutput<typeof UserTypeSchema>;
export type UserSettingsType = v.InferOutput<typeof UserSettingsSchema>;
export type UserStatisticsType = v.InferOutput<typeof UserStatisticsSchema>;

export const parseUserType = (
  data: unknown,
): { success: true; data: UserType } | { success: false; error: string } => {
  const result = v.safeParse(UserTypeSchema, data);
  if (result.success) {
    return { success: true, data: result.output };
  }
  return {
    success: false,
    error: `User validation failed: ${v.flatten(result.issues).nested?.toString() ?? "unknown error"}`,
  };
};
