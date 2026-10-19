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

export const loadFocusTraining = (
  type: TrainingType,
): FocusTraining | undefined => loadFocusTrainings()[type];
