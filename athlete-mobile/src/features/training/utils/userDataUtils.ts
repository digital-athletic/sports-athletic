import type { UserType } from "@/schemas/user.schema";
import type { TemporalDataType } from "@/features/training/models/TemporalData";

const DEFAULT_HEIGHT = 175;
const DEFAULT_WEIGHT = 65;

/**
 * Safely gets temporal data from user as ISO date strings.
 * Returns empty array if temporalData is undefined.
 */
export function getTemporalData(user: UserType): TemporalDataType[] {
  if (!user.temporalData) return [];

  return user.temporalData.map((td) => ({
    tag: td.tag,
    date: td.date,
    expiration: td.expiration,
  }));
}

/**
 * Gets temporal data tags as a string array.
 * Useful for filtering and checking active soreness/pain tags.
 */
export function getTemporalTags(user: UserType): string[] {
  if (!user.temporalData) return [];
  return user.temporalData.map((td) => td.tag);
}

/**
 * Type for a non-null training plan with sections.
 */
export type ValidTrainingPlan = NonNullable<UserType["trainingPlan"]> & {
  sections: NonNullable<NonNullable<UserType["trainingPlan"]>["sections"]>;
};

/**
 * Asserts that the user has a valid training plan.
 * Throws a generator error if trainingPlan is null/undefined.
 */
export function requireTrainingPlan(user: UserType): ValidTrainingPlan {
  if (!user.trainingPlan) {
    throw {
      type: "NO_TRAINING_PLAN",
      subtype: "MISSING_PLAN",
      params: [],
    };
  }
  if (!user.trainingPlan.sections || user.trainingPlan.sections.length === 0) {
    throw {
      type: "NO_TRAINING_PLAN",
      subtype: "MISSING_SECTIONS",
      params: [],
    };
  }
  return user.trainingPlan as ValidTrainingPlan;
}

/**
 * Checks if user has a valid training plan without throwing.
 */
export function hasTrainingPlan(
  user: UserType,
): user is UserType & { trainingPlan: ValidTrainingPlan } {
  return (
    user.trainingPlan !== null &&
    user.trainingPlan !== undefined &&
    Array.isArray(user.trainingPlan.sections) &&
    user.trainingPlan.sections.length > 0
  );
}

/**
 * Asserts that the user has completed anamnesis (has workoutData).
 * Throws a generator error if workoutData is undefined.
 */
export function requireWorkoutData(
  user: UserType,
): NonNullable<UserType["workoutData"]> {
  if (!user.workoutData) {
    throw {
      type: "NO_ANAMNESIS",
      subtype: "MISSING_WORKOUT_DATA",
      params: [],
    };
  }
  return user.workoutData;
}

/**
 * Checks if user has completed anamnesis.
 */
export function hasWorkoutData(
  user: UserType,
): user is UserType & { workoutData: NonNullable<UserType["workoutData"]> } {
  return user.workoutData !== undefined;
}

/**
 * Get user's height from personalData.
 */
export function getUserHeight(user: UserType): number {
  return user.personalData?.height ?? DEFAULT_HEIGHT;
}

/**
 * Get user's weight from personalData.
 */
export function getUserWeight(user: UserType): number {
  return user.personalData?.weight ?? DEFAULT_WEIGHT;
}

/**
 * Get user's birthday from personalData.
 */
export function getUserBirthday(user: UserType): string {
  return user.personalData?.birthday ?? "";
}

/**
 * Get user's gender from personalData.
 */
export function getUserGender(user: UserType): "MALE" | "FEMALE" {
  return user.personalData?.gender ?? "FEMALE";
}
