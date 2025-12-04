/**
 * returns the given object with field names converted to camelCase
 *
 * @param input - Array of objects we want to lower case
 * @returns Array<string> - specified muscle names
 */
export const fieldNamesToLowerCase = (
  input: Record<string, any>[],
): Record<string, any>[] => {
  return input.map((entry) => {
    let converted: Record<string, any> = {};
    for (let key in entry) {
      let first = key.substring(0, 1);
      let ending = key.substring(1);
      let newKey = first.toLowerCase() + ending;
      converted[newKey] = entry[key];
    }
    return converted;
  });
};
