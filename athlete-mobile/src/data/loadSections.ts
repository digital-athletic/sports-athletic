import SectionsJson from "../../assets/data/sections.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  SectionsFileSchema,
  type SectionsFile,
} from "@/schemas/sections.schema";

export const parseSections = (data: unknown): SectionsFile =>
  parseData(SectionsFileSchema, data, "Sections");

// The screens only read the sections, so every call returns the same frozen value.
export const loadSections = createDataLoader(
  () => parseSections(SectionsJson),
  "frozen",
);
