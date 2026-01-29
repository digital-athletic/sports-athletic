import { WorkoutConstants } from "@/constants/workoutConstants";
import type { MaxValuesType } from "./MaxValues";
import type { SeasonPhaseType } from "./SeasonPhase";
import type { TagsByGroup } from "./Tags";

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
  sport: Sport;
  /**
   * User preference tags in structured format.
   * Keys are tag group identifiers (e.g., "LEVEL", "POSITION", "PAIN"),
   * values are arrays of selected tag values.
   */
  tags: TagsByGroup;
  seasonPhase: SeasonPhaseType;
  maxValues: MaxValuesType;
};
