import type { GeneratorError } from "@/features/training/models/GeneratorError";

/**
 * Builds the error of a skill that no exercise fits. The default is the
 * equipment error of an emptied skill.
 *
 * generateGeneratorError({ subtype: "AGE" })
 * → { type: "NO_EXERCISES", subtype: "AGE", params: [] }
 */
export const generateGeneratorError = (
  overrides: Partial<GeneratorError> = {},
): GeneratorError => ({
  type: "NO_EXERCISES",
  subtype: "EQUIPMENT",
  params: [],
  ...overrides,
});

/**
 * Builds the equipment error an emptied skill records.
 *
 * generateEquipmentError(["DUMBBELL"])
 * → { type: "NO_EXERCISES", subtype: "EQUIPMENT", params: ["DUMBBELL"] }
 */
export const generateEquipmentError = (params: string[] = []): GeneratorError =>
  generateGeneratorError({ subtype: "EQUIPMENT", params });
