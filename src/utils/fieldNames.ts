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
