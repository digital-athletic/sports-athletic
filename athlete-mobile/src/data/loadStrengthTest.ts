import StrengthTestData from "../../assets/data/generator/strengthTest.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  StrengthTestSchema,
  type StrengthTest,
} from "@/schemas/generator.schema";

export const parseStrengthTest = (data: unknown): StrengthTest =>
  parseData(StrengthTestSchema, data, "StrengthTest");

// Fresh copy per call, so the generator can mutate the result.
export const loadStrengthTest = createDataLoader(
  () => parseStrengthTest(StrengthTestData),
  "clone",
);
