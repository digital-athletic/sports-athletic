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
  SeasonPhaseEnumSchema,
  SectionTypesSchema,
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
  /** Test date as Unix timestamp in milliseconds (Date.now()) */
  testDate: v.number(),
  verticalPush: MaxValueSchema,
  verticalPull: MaxValueSchema,
  horizontalPush: MaxValueSchema,
  horizontalPull: MaxValueSchema,
  hip: MaxValueSchema,
  knee: MaxValueSchema,
  lowerBody: MaxValueSchema,
});
export type MaxValuesType = v.InferOutput<typeof MaxValuesSchema>;

// Exercise branch entry schema for UserTraining skills
export const UserTrainingExerciseBranchSchema = v.looseObject({
  branchId: v.optional(v.string()),
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
  /** End date in ISO 8601 format (YYYY-MM-DD) */
  endDate: v.string(),
});

export type SeasonPhaseSchemaType = v.InferOutput<typeof SeasonPhaseSchema>;

/**
 * Personal data schema - canonical source for user identity data.
 * This is the single source of truth for gender, birthday, height, and weight.
 */
export const PersonalDataSchema = v.object({
  username: v.optional(v.string()),
  gender: v.picklist(["MALE", "FEMALE"]),
  birthday: v.string(), // ISO 8601 format (YYYY-MM-DD)
  height: v.optional(v.number()), // Height in cm (50-250)
  weight: v.optional(v.number()), // Weight in kg (20-300)
});

/**
 * Schema for user tags in structured format.
 * Keys are tag group identifiers (e.g., "LEVEL", "POSITION", "PAIN"),
 * values are arrays of selected tag values.
 */
export const TagsByGroupSchema = v.record(v.string(), v.array(v.string()));

/**
 * Workout-specific data schema.
 *
 * NOTE: gender, birthday, anamnesisCompleted, height, and weight have been moved to
 * user.personalData and user.anamnesisCompleted respectively.
 * These fields are kept here with v.optional() for backward compatibility
 * during data migration but should NOT be used for new code.
 *
 */
export const WorkoutDataSchema = v.looseObject({
  /** User preference tags in structured format (e.g., { LEVEL: ["BEGINNER"], PAIN: ["KNEE"] }) */
  tags: v.optional(TagsByGroupSchema),
  maxValues: v.optional(MaxValuesSchema),
  seasonPhase: v.optional(SeasonPhaseSchema),
});

// ISO 8601 date strings
export const TemporalDataSchema = v.object({
  date: v.string(),
  expiration: v.string(),
  tag: v.string(),
});

export const TrainingSectionSchema = v.looseObject({
  /** Section start date in ISO 8601 format (YYYY-MM-DD) */
  start: v.string(),
  numOfWeeks: v.number(),
  type: SectionTypesSchema,
  cardioType: CardioTypesSchema,
  trainings: v.array(UserTrainingSchema),
});

export type TrainingSectionSchemaType = v.InferOutput<
  typeof TrainingSectionSchema
>;

export const TrainingPlanSchema = v.object({
  /** Training plan start date in ISO 8601 format (YYYY-MM-DD) */
  start: v.string(),
  sections: v.array(TrainingSectionSchema),
});

export type TrainingPlanSchemaType = v.InferOutput<typeof TrainingPlanSchema>;

// Aligned with userSettingsStore.ts ReviewStatusType
export const ReviewStatusSchema = v.object({
  hasReviewed: v.boolean(),
  lastPromptDate: v.optional(v.string()),
  promptCount: v.optional(v.number()),
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
  /** Single source of truth for user personal data (gender, birthday, username) */
  personalData: v.optional(PersonalDataSchema),
  /** Whether user has completed the anamnesis flow */
  anamnesisCompleted: v.optional(v.boolean()),
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
