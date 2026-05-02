/**
 * Per-store version numbers.
 *
 * RULES:
 * - Increment ONLY the version of the store whose schema changed.
 * - Add a corresponding migration in src/store/migrations/<storeName>Migrations.ts
 * - Version 14 is the first per-store version (after legacy shared version 13).
 * - Never go below 14.
 *
 * History:
 * - Versions 1-13: Shared PERSIST_VERSION era (all stores shared one number).
 * - Version 14+: Per-store versioning.
 */
export const STORE_VERSIONS = {
  AUTH: 15,
  USER_PROFILE: 14,
  USER_WORKOUT: 16,
  USER_SETTINGS: 15,
  ANAMNESIS: 15,
  TRAINING_SCHEDULE: 14,
  PLACES: 14,
  COMPLETED_WORKOUTS: 14,
  SYNC_QUEUE: 14,
  EXERCISE_PROGRESS: 15,
} as const;
