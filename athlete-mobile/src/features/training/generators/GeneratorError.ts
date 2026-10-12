export type GeneratorError = {
  type: "NO_EXERCISES" | "NO_ANAMNESIS" | "TOO_MUCH_SORENESS" | "OTHER";
  subtype:
    | "SKILL_TREE"
    | "SORENESS"
    | "PAIN"
    | "EQUIPMENT"
    | "AGE"
    | "GENDER"
    | "OTHER"
    | "TEST_WORKOUT"
    | "MULTIPLE_REGIONS"
    | "MISSING_WORKOUT_DATA"
    | "PREV_SHORT_TRAINING_SORENESS";
  params: string[];
};

export const isGeneratorError = (e: unknown): e is GeneratorError =>
  typeof e === "object" &&
  e !== null &&
  "type" in e &&
  typeof e.type === "string" &&
  "subtype" in e &&
  typeof e.subtype === "string" &&
  "params" in e &&
  Array.isArray(e.params);
