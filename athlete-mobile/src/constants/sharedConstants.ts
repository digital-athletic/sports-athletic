/**
 * Cleaned Constants after Migration of old App
 */
const APP_NAME = "SportsAthletic";
const TIME_IN_MS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 + 1000,
  YEAR: 365 * 24 * 60 * 60 + 1000,
};
const FILE_PATH_EXERCISES = "exerciseData";
const FILE_PATH_SKILL_TREES = "skillTrees";
const FILE_PATH_NOTIFICATIONS_DATA = "notificationsData";
const SUPABASE_VIDEO_BUCKET = "videos";
const SUPABASE_IMAGE_BUCKET = "images";
export type GeneratprErrorTypes = "NO_EXERCISES" | "OTHER";
export type GeneratorErrorSubTypes =
  | "SKILL_TREE"
  | "SORENESS"
  | "PAIN"
  | "EQUIPMENT"
  | "OTHER";
export type GeneratorErrorParamTypes =
  | "TO_MUCH_MUSCLE_SORENESS"
  | "MISSING_EQUIPMENT"
  | "OTHER";

const LINK_AGB = "https://www.sports-athletic.com/agb";
const LINK_PRIVACY = "https://www.sports-athletic.com/datenschutz";

const CONNECTION_TIMOUT_MS = 1000 * 45; // 45 seconds

/**
 * Version of persisted state
 *
 * Increment to trigger a reset of all persisted stores to their default state.
 * This prevents errors from incompatible data structures after app updates.
 *
 * When to increment:
 * - Removing or renaming fields in persisted stores
 * - Changing field types (e.g., string to number)
 * - Restructuring nested objects
 * - Any breaking change to store state shape
 *
 * How to increment:
 * - Run: pnpm bump:persist-version
 * - Or manually increment the number below
 *
 * Note: Incrementing this will log out users and clear all app data.
 */
const PERSIST_VERSION = 9;

export const SharedConstants = {
  APP_NAME,
  CONNECTION_TIMOUT_MS,
  FILE_PATH_EXERCISES,
  FILE_PATH_NOTIFICATIONS_DATA,
  FILE_PATH_SKILL_TREES,
  LINK_AGB,
  LINK_PRIVACY,
  PERSIST_VERSION,
  SUPABASE_IMAGE_BUCKET,
  SUPABASE_VIDEO_BUCKET,
  TIME_IN_MS,
};
