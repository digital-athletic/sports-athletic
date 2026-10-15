import * as v from "valibot";
import MaxMinutesData from "../../assets/data/generator/maxMinutes.json";
import { MaxMinutesSchema, type MaxMinutes } from "@/schemas/generator.schema";

export const loadMaxMinutes = (): MaxMinutes => {
  const result = v.safeParse(MaxMinutesSchema, MaxMinutesData);

  if (!result.success) {
    console.error("Max minutes validation failed:", v.flatten(result.issues));
    throw new Error("Max minutes data validation failed");
  }

  return result.output;
};
