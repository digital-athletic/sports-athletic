import TutorialsJson from "../../assets/data/tutorials.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  TutorialsFileSchema,
  type TutorialsFile,
} from "@/schemas/tutorials.schema";

export const parseTutorials = (data: unknown): TutorialsFile =>
  parseData(TutorialsFileSchema, data, "Tutorials");

// The screen only reads the tutorials, so every call returns the same frozen value.
export const loadTutorials = createDataLoader(
  () => parseTutorials(TutorialsJson),
  "frozen",
);
