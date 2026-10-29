import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { useUserProfileStore } from "@/store/userProfileStore";
import type { useUserWorkoutStore } from "@/store/userWorkoutStore";

type WorkoutData = ReturnType<
  typeof useUserWorkoutStore.getState
>["workoutData"];
type PersonalData = ReturnType<
  typeof useUserProfileStore.getState
>["personalData"];

/**
 * Builds the workout data of an advanced athlete with the default max values,
 * as the completion of an exercise reads it from the user workout store.
 *
 * generateAdvancedWorkoutData()
 * → { sport: "OTHER_SPORT", tags: { LEVEL: ["ADVANCED"] }, seasonPhase: { type: null, endDate: "2026-01-01" }, maxValues: DEFAULT_MAX_VALUES }
 */
export const generateAdvancedWorkoutData = (): WorkoutData => ({
  sport: "OTHER_SPORT",
  tags: { LEVEL: ["ADVANCED"] },
  seasonPhase: { type: null, endDate: "2026-01-01" },
  maxValues: DEFAULT_MAX_VALUES,
});

/**
 * Builds the personal data of an adult male athlete.
 *
 * generateAdultMalePersonalData()
 * → { username: "test", gender: "MALE", birthday: "1990-01-01" }
 */
export const generateAdultMalePersonalData = (): PersonalData => ({
  username: "test",
  gender: "MALE",
  birthday: "1990-01-01",
});
