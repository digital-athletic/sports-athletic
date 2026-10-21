import SkillCatalogData from "../../assets/data/generator/skills.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  SkillCatalogSchema,
  type SkillCatalog,
  type SkillCatalogEntry,
} from "@/schemas/skillCatalog.schema";

export const parseSkillCatalog = (data: unknown): SkillCatalog =>
  parseData(SkillCatalogSchema, data, "skill catalog");

// Every call shares one frozen value.
export const loadSkillCatalog = createDataLoader(
  () => parseSkillCatalog(SkillCatalogData),
  "frozen",
);

// Object.hasOwn keeps prototype keys like "constructor" from matching.
export const loadSkillCatalogEntry = (
  code: string,
): SkillCatalogEntry | undefined => {
  const catalog = loadSkillCatalog();
  return Object.hasOwn(catalog, code)
    ? catalog[code as keyof SkillCatalog]
    : undefined;
};
