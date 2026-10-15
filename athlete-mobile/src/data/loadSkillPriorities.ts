import SkillPrioritiesData from "../../assets/data/generator/skillPriorities.json";
import {
  SkillPrioritiesSchema,
  type SkillPriorities,
} from "@/schemas/generator.schema";
import { cloneWithValidation } from "@/utils/cloneWithValidation";

// The generator mutates the result, so every call returns a fresh validated copy.
export const loadSkillPriorities = (): SkillPriorities =>
  cloneWithValidation(
    SkillPrioritiesData,
    SkillPrioritiesSchema,
    "SkillPriorities",
  );
