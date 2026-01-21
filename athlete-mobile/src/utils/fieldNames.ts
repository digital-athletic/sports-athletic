/**
 * Converts field names in objects to camelCase.
 */
export const fieldNamesToLowerCase = (
  input: Record<string, any>[],
): Record<string, any>[] => {
  return input.map((entry) =>
    Object.entries(entry).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key.charAt(0).toLowerCase() + key.slice(1)]: value,
      }),
      {} as Record<string, any>,
    ),
  );
};

/**
 * Transforms exercise data by:
 * 1. Converting field names to camelCase
 * 2. Converting ID fields (id, otherSideExerciseId, equivalentExercises) to strings
 */
export const transformExerciseData = (
  input: Record<string, any>[],
): Record<string, any>[] => {
  return fieldNamesToLowerCase(input).map((entry) => ({
    ...entry,
    id: String(entry.id),
    ...(entry.otherSideExerciseId !== undefined && {
      otherSideExerciseId: String(entry.otherSideExerciseId),
    }),
    ...(entry.equivalentExercises !== undefined && {
      equivalentExercises: entry.equivalentExercises.map(String),
    }),
  }));
};
