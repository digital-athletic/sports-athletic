import { WorkoutConstants } from "@/constants/workoutConstants";
import type { MaxValuesType } from "./MaxValues";
import type { SeasonPhaseType } from "./SeasonPhase";

export type Sport = keyof typeof WorkoutConstants.SPORTS; // e.g., 'SOCCER', 'BASKETBALL', etc.

/**
 * Workout-specific data type.
 *
 * NOTE: gender, birthday, anamnesisCompleted, height, and weight have been moved to
 * userProfileStore as the single source of truth. Components needing these values should
 * read from userProfileStore.personalData and userProfileStore.anamnesisCompleted.
 *
 * @see getUserHeight, getUserWeight from userDataUtils.ts for accessing these values
 * with fallback support during migration.
 */
export type UserWorkoutDataType = {
  /**
   * @deprecated Use userProfileStore.personalData.weight instead.
   * Kept optional for backward compatibility during migration.
   */
  weight?: number;
  /**
   * @deprecated Use userProfileStore.personalData.height instead.
   * Kept optional for backward compatibility during migration.
   */
  height?: number;
  sport: Sport;
  tags: string[];
  seasonPhase: SeasonPhaseType;
  maxValues: MaxValuesType;
};
