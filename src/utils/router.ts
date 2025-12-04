/**
 * Parses a string navigation parameter to an integer.
 * @param input - The navigation param value
 * @returns The parsed integer or undefined if parsing fails
 */
export const parseIntParam = (input: string | undefined) => {
  if (input === undefined) {
    return undefined;
  }

  const numberValue = parseInt(input, 10);
  if (!isNaN(numberValue)) {
    return numberValue;
  }
  return undefined;
};

/**
 * Parses a string navigation parameter to a boolean.
 * @param input - The navigation param value
 * @returns True if input is "true" (case-insensitive), false otherwise
 */
export const parseBooleanParam = (input: string | undefined) => {
  return input?.trim().toLowerCase() === "true";
};
