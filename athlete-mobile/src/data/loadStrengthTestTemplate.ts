import TEST from "../../assets/data/templates/TEST.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  StrengthTestTemplateSchema,
  type StrengthTestTemplate,
} from "@/schemas/strengthTestTemplate.schema";

const STRENGTH_TEST_TEMPLATE_ID = "TEST";

export const parseStrengthTestTemplate = (
  data: unknown,
): StrengthTestTemplate => {
  const template = parseData(
    StrengthTestTemplateSchema,
    data,
    `template ${STRENGTH_TEST_TEMPLATE_ID}`,
    STRENGTH_TEST_TEMPLATE_ID,
  );
  if (template.id !== STRENGTH_TEST_TEMPLATE_ID) {
    throw new Error(
      `${STRENGTH_TEST_TEMPLATE_ID}.id: the strength test template has the id ${template.id}`,
    );
  }
  return template;
};

// loadTemplates leaves TEST out, so no short workout resolves the strength test.
export const loadStrengthTestTemplate = createDataLoader(
  () => parseStrengthTestTemplate(TEST),
  "frozen",
);
