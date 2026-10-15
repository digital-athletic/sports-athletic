import SkillPrioritiesData from "../../assets/data/generator/skillPriorities.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  SkillPrioritiesSchema,
  type SkillPriorities,
} from "@/schemas/generator.schema";

export const parseSkillPriorities = (data: unknown): SkillPriorities =>
  parseData(SkillPrioritiesSchema, data, "SkillPriorities");

// The generator mutates the result, so every call returns a fresh copy.
export const loadSkillPriorities = createDataLoader(
  () => parseSkillPriorities(SkillPrioritiesData),
  "clone",
);
