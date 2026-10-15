import * as v from "valibot";
import StrengthTestData from "../../assets/data/generator/strengthTest.json";
import {
  StrengthTestSchema,
  type StrengthTest,
} from "@/schemas/generator.schema";

export const loadStrengthTest = (): StrengthTest => {
  const result = v.safeParse(StrengthTestSchema, StrengthTestData);

  if (!result.success) {
    console.error("Strength test validation failed:", v.flatten(result.issues));
    throw new Error("Strength test data validation failed");
  }

  return result.output;
};
