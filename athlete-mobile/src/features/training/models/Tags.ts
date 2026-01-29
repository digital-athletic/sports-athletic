/**
 * Tag type definitions for user preferences.
 *
 * User tags use a structured format (TagsByGroup) where tags are organized by category.
 * This is different from exercise/branch tags which use a flat string[] format.
 *
 * @example
 * ```typescript
 * const userTags: TagsByGroup = {
 *   LEVEL: ["BEGINNER"],
 *   POSITION: ["FIELD"],
 *   PAIN: ["KNEE", "BACK"],
 * };
 * ```
 */

/**
 * Tag groups that can contain user-selected values.
 * These are the valid keys for user preference tags.
 *
 * Note: Exercise/branch tags may use additional tag groups (e.g., MUSCLE, REGION)
 * but those are not user-selectable preferences.
 */
export type UserTagGroup =
  | "LEVEL"
  | "POSITION"
  | "PAIN"
  | "EQ" // Equipment - uses TagGroups.EQUIPMENT value
  | "PREVENTION";

/**
 * Tags grouped by category - canonical format for user preference tags.
 *
 * This is the single format for storing user tags throughout the application.
 * Keys are tag group identifiers, values are arrays of selected tag values.
 *
 * Note: This uses Partial to allow any subset of tag groups to be defined,
 * and Record<string, string[]> to allow compatibility with anamnesisStore.tags.
 */
export type TagsByGroup = Partial<Record<UserTagGroup, string[]>> &
  Record<string, string[]>;
