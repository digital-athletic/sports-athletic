import FocusTrainingsData from "../../assets/data/generator/focusTrainings.json";
import { createDataLoader, parseData } from "./createDataLoader";
import type { TrainingType } from "@/features/training/models/Training";
import {
  FocusTrainingsSchema,
  type FocusTraining,
  type FocusTrainings,
} from "@/schemas/focusTraining.schema";

export const parseFocusTrainings = (data: unknown): FocusTrainings =>
  parseData(FocusTrainingsSchema, data, "Focus trainings");

// The generator only reads the templates, so every call shares one frozen value.
export const loadFocusTrainings = createDataLoader(
  () => parseFocusTrainings(FocusTrainingsData),
  "frozen",
);

// Every skill code or training type can ask; only template keys find one.
export const loadFocusTraining = (
  type: TrainingType,
): FocusTraining | undefined => {
  const templates = loadFocusTrainings();
  return Object.hasOwn(templates, type) ? templates[type] : undefined;
};

// Languages without a template text read English, the fallback language.
export const loadFocusTrainingTitle = (
  type: TrainingType,
  language: string | undefined,
): string | undefined =>
  loadFocusTraining(type)?.title[language === "de" ? "de" : "en"];
