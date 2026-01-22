import * as v from "valibot";
import {
  CardioTypesSchema,
  SectionTypesSchema,
  SeasonPhaseEnumSchema,
} from "./common.schema";

export const SeasonPhaseSchema = v.object({
  type: v.union([SeasonPhaseEnumSchema, v.null()]),
  numOfWeeks: v.optional(v.number()),
  endDate: v.string(),
});

export const WorkoutDataSchema = v.looseObject({
  gender: v.optional(v.picklist(["MALE", "FEMALE"])),
  anamnesisCompleted: v.optional(v.boolean()),
  seasonPhase: v.optional(SeasonPhaseSchema),
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
  trainings: v.array(v.unknown()),
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
