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

const CONNECTION_TIMOUT_MS = 1000 * 45; // 45 seconds

export const SharedConstants = {
  APP_NAME,
  CONNECTION_TIMOUT_MS,
  FILE_PATH_EXERCISES,
  FILE_PATH_NOTIFICATIONS_DATA,
  FILE_PATH_SKILL_TREES,
  TIME_IN_MS,
};
