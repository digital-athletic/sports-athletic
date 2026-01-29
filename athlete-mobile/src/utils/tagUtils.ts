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

import type { TagsByGroup } from "@/features/training/models/Tags";

/**
 * Extract tag values by tag group from a tags array.
 * Filters tags that start with a specific prefix and returns the suffix values.
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
    .filter((tag) => tag.startsWith(prefix))
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
