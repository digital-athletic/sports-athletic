import * as v from "valibot";

// Validated clone utility
export function cloneWithValidation<T>(
  data: unknown,
  schema: v.GenericSchema<T>,
  name: string,
): T {
  const cloned = JSON.parse(JSON.stringify(data));
  const result = v.safeParse(schema, cloned);
  if (!result.success) {
    console.error(`Validation failed for ${name}:`, v.flatten(result.issues));
    throw new Error(`Invalid data structure for ${name}`);
  }
  return result.output;
}
