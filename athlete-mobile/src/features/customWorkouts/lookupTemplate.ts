import { loadTemplate, readLocalizedTemplateName } from "@/data/loadTemplates";
import type { Template } from "@/schemas/aiwl.schema";
import {
  findCustomTemplate,
  type State,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";

/** Bundled template first, then an imported one by app id. Components pass their subscribed workoutsById. */
export const lookupTemplate = (
  id: string,
  workoutsById: State["workoutsById"] = useCustomWorkoutsStore.getState()
    .workoutsById,
): Template | undefined =>
  loadTemplate(id) ?? findCustomTemplate(workoutsById, id);

export const lookupTemplateName = (
  id: string,
  language: string | undefined,
  workoutsById?: State["workoutsById"],
): string | undefined => {
  const template = lookupTemplate(id, workoutsById);
  return template && readLocalizedTemplateName(template.name, language);
};
