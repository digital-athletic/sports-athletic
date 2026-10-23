import BAS from "../../assets/data/templates/BAS.json";
import BR from "../../assets/data/templates/BR.json";
import CD from "../../assets/data/templates/CD.json";
import GKS from "../../assets/data/templates/GKS.json";
import MOB from "../../assets/data/templates/MOB.json";
import PREV from "../../assets/data/templates/PREV.json";
import PREVANKLE from "../../assets/data/templates/PREVANKLE.json";
import PREVKNEE from "../../assets/data/templates/PREVKNEE.json";
import PREVSHOULDER from "../../assets/data/templates/PREVSHOULDER.json";
import PREVSPINE from "../../assets/data/templates/PREVSPINE.json";
import PREVWRIST from "../../assets/data/templates/PREVWRIST.json";
import STABILITY from "../../assets/data/templates/STABILITY.json";
import WU from "../../assets/data/templates/WU.json";
import { createDataLoader, parseData } from "./createDataLoader";
import { TemplateSchema, type Template } from "@/schemas/aiwl.schema";

// Metro cannot glob, so every bundled template file is imported by name.
const TEMPLATE_FILES: Record<string, unknown> = {
  WU,
  MOB,
  BR,
  CD,
  BAS,
  GKS,
  STABILITY,
  PREV,
  PREVSHOULDER,
  PREVKNEE,
  PREVWRIST,
  PREVANKLE,
  PREVSPINE,
};

export const parseTemplates = (
  files: Record<string, unknown>,
): Record<string, Template> =>
  Object.fromEntries(
    Object.entries(files).map(([key, data]) => {
      const template = parseData(TemplateSchema, data, `template ${key}`, key);
      if (template.id !== key) {
        throw new Error(`${key}.id: file key and id differ`);
      }
      return [key, template];
    }),
  );

// Every call shares one frozen value.
export const loadTemplates = createDataLoader(
  () => parseTemplates(TEMPLATE_FILES),
  "frozen",
);

// Object.hasOwn keeps prototype keys like "constructor" from matching.
export const loadTemplate = (id: string): Template | undefined => {
  const templates = loadTemplates();
  return Object.hasOwn(templates, id) ? templates[id] : undefined;
};

/** The text in the language, falling back to en. */
export const readLocalizedTemplateName = (
  name: Template["name"],
  language: string | undefined,
): string =>
  language !== undefined && Object.hasOwn(name, language)
    ? name[language]
    : name.en;
