/**
 * Tag utility functions for extracting and filtering tag values.
 *
 * There are two tag formats in the codebase:
 * 1. Flat format (string[]): Used for exercise/branch tags from external data.
 *    Example: ["LEVEL_ADVANCED", "MUSCLE_QUAD"]
 *    Use getTagValues() and getTagValue() for these.
 *
 * 2. Structured format (TagsByGroup): Used for user preference tags.
 *    Example: { LEVEL: ["BEGINNER"], PAIN: ["KNEE"] }
 *    Use getUserTagValues() and getUserTagValue() for these.
 */

import { TagGroups } from "@/constants/tagGroups";
import type { TagsByGroup } from "@/features/training/models/Tags";

/**
 * Defines tag group hierarchies where a parent group has sub-groups.
 * When extracting values for a parent group, tags belonging to sub-groups
 * are automatically excluded.
 *
 * Example: EQ_DUMBBELL is equipment, but EQ_TYPE_WEIGHTS is an equipment type.
 * When querying "EQ", we want DUMBBELL but not TYPE_WEIGHTS.
 */
export const TAG_GROUP_SUBGROUPS: Partial<Record<TagGroups, TagGroups[]>> = {
  [TagGroups.EQUIPMENT]: [TagGroups.EQ_TYPE],
  [TagGroups.MUSCLE]: [
    TagGroups.MUSCLE_SECONDARY,
    TagGroups.MUSCLE_INVOLVEMENT,
  ],
};

/**
 * Checks if a tag belongs to a parent group but not to any of its sub-groups.
 * Useful for filtering equipment tags while excluding equipment type tags, etc.
 *
 * @param tag - The full tag string (e.g., "EQ_DUMBBELL" or "EQ_TYPE_WEIGHTS")
 * @param tagGroup - The parent tag group prefix (e.g., "EQ")
 * @returns true if tag belongs to the parent group but not a sub-group
 *
 * @example
 * ```tsx
 * isTagInGroup("EQ_DUMBBELL", "EQ");      // true
 * isTagInGroup("EQ_TYPE_WEIGHTS", "EQ");  // false (belongs to sub-group)
 * isTagInGroup("MUSCLE_CHEST", "MUSCLE"); // true
 * isTagInGroup("MUSCLE_SECONDARY_BACK", "MUSCLE"); // false (belongs to sub-group)
 * ```
 */
export function isTagInGroup(tag: string, tagGroup: string): boolean {
  const prefix = `${tagGroup}_`;
  if (!tag.startsWith(prefix)) {
    return false;
  }

  const subGroups = TAG_GROUP_SUBGROUPS[tagGroup as TagGroups] ?? [];
  const excludedPrefixes = subGroups.map((subGroup) => `${subGroup}_`);

  return !excludedPrefixes.some((excluded) => tag.startsWith(excluded));
}

/**
 * Extract tag values by tag group from a tags array.
 * Filters tags that start with a specific prefix and returns the suffix values.
 * Automatically excludes tags that belong to sub-groups of the requested group.
 *
 * @param tags - Array of tags (e.g., ["LEVEL_BEGINNER", "AGE_ADULT", ...])
 * @param tagGroup - Tag group prefix to filter by (e.g., "LEVEL", "AGE")
 * @returns Array of tag values without the group prefix (e.g., ["BEGINNER"])
 *
 * @example
 * ```tsx
 * const tags = ["LEVEL_ADVANCED", "AGE_ADULT", "GENDER_MALE"];
 * const level = getTagValues(tags, "LEVEL"); // ["ADVANCED"]
 * const age = getTagValues(tags, "AGE");     // ["ADULT"]
 *
 * // Sub-groups are automatically excluded:
 * const tags2 = ["EQ_DUMBBELL", "EQ_TYPE_WEIGHTS", "MUSCLE_CHEST", "MUSCLE_SECONDARY_BACK"];
 * getTagValues(tags2, "EQ");     // ["DUMBBELL"] - excludes TYPE_WEIGHTS
 * getTagValues(tags2, "MUSCLE"); // ["CHEST"] - excludes SECONDARY_BACK
 * ```
 */
export function getTagValues(
  tags: readonly string[],
  tagGroup: string,
): string[] {
  if (!tags || !Array.isArray(tags)) {
    return [];
  }

  const prefix = `${tagGroup}_`;
  return tags
    .filter((tag) => isTagInGroup(tag, tagGroup))
    .map((tag) => tag.replace(prefix, ""));
}

/**
 * Extract the first tag value by tag group.
 * Convenience function for cases where only one value is expected.
 *
 * @param tags - Array of tags
 * @param tagGroup - Tag group prefix to filter by
 * @returns First tag value, or undefined if not found
 *
 * @example
 * ```tsx
 * const tags = ["LEVEL_BEGINNER", "AGE_ADULT"];
 * const level = getTagValue(tags, "LEVEL"); // "BEGINNER"
 * ```
 */
export function getTagValue(
  tags: readonly string[],
  tagGroup: string,
): string | undefined {
  const values = getTagValues(tags, tagGroup);
  return values[0];
}

/**
 * Extract tag values from structured user tags by tag group.
 *
 * @param tags - Tags in structured format (e.g., { LEVEL: ["BEGINNER"], PAIN: ["KNEE"] })
 * @param tagGroup - Tag group key to look up (e.g., "LEVEL", "PAIN")
 * @returns Array of tag values for the group, or empty array if not found
 *
 * @example
 * ```tsx
 * const tags = { LEVEL: ["ADVANCED"], PAIN: ["KNEE", "BACK"] };
 * getUserTagValues(tags, "PAIN"); // ["KNEE", "BACK"]
 * getUserTagValues(tags, "POSITION"); // []
 * ```
 */
export function getUserTagValues(
  tags: TagsByGroup | undefined,
  tagGroup: string,
): string[] {
  if (!tags) {
    return [];
  }
  return tags[tagGroup] ?? [];
}

/**
 * Extract the first tag value from structured user tags by tag group.
 * Convenience function for cases where only one value is expected.
 *
 * @param tags - Tags in structured format
 * @param tagGroup - Tag group key to look up
 * @returns First tag value, or undefined if not found
 *
 * @example
 * ```tsx
 * const tags = { LEVEL: ["ADVANCED"], POSITION: ["FIELD"] };
 * getUserTagValue(tags, "LEVEL"); // "ADVANCED"
 * getUserTagValue(tags, "PAIN"); // undefined
 * ```
 */
export function getUserTagValue(
  tags: TagsByGroup | undefined,
  tagGroup: string,
): string | undefined {
  const values = getUserTagValues(tags, tagGroup);
  return values[0];
}
