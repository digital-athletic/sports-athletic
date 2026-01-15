/**
 * Tag utility functions for extracting and filtering tag values.
 * Tags are stored as strings with format "TAG_VALUE" in arrays.
 */

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
export function getTagValues(tags: string[], tagGroup: string): string[] {
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
  tags: string[],
  tagGroup: string,
): string | undefined {
  const values = getTagValues(tags, tagGroup);
  return values[0];
}

/**
 * Convert anamnesis tags format to workout tags format.
 * Transforms the object-based format used by anamnesisStore to the
 * array-based format used by userWorkoutStore.
 *
 * @param anamnesisTags - Tags in anamnesis format (e.g., { LEVEL: ["BEGINNER"], PAIN: ["KNEE"] })
 * @returns Tags in workout format (e.g., ["LEVEL_BEGINNER", "PAIN_KNEE"])
 *
 * @example
 * ```tsx
 * const anamnesisTags = { LEVEL: ["ADVANCED"], POSITION: ["FIELD"] };
 * const workoutTags = convertAnamnesisTagsToWorkoutTags(anamnesisTags);
 * // Result: ["LEVEL_ADVANCED", "POSITION_FIELD"]
 * ```
 */
export function convertAnamnesisTagsToWorkoutTags(anamnesisTags: {
  [tag: string]: string[];
}): string[] {
  return Object.entries(anamnesisTags).flatMap(([tagGroup, values]) =>
    values.map((value) => `${tagGroup}_${value}`),
  );
}
