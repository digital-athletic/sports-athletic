import MaxMinutesData from "../../assets/data/generator/maxMinutes.json";
import { createDataLoader, parseData } from "./createDataLoader";
import { MaxMinutesSchema, type MaxMinutes } from "@/schemas/generator.schema";

export const parseMaxMinutes = (data: unknown): MaxMinutes =>
  parseData(MaxMinutesSchema, data, "MaxMinutes");

// Read only data: every call returns the same deep frozen value.
export const loadMaxMinutes = createDataLoader(
  () => parseMaxMinutes(MaxMinutesData),
  "frozen",
);
