import { createDataLoader, parseData } from "./createDataLoader";
import PauseJson from "../../assets/data/generator/trainingSections/pause.json";
import CompetitionJson from "../../assets/data/generator/trainingSections/competition.json";
import PreparatoryJson from "../../assets/data/generator/trainingSections/preparatory.json";
import {
  TrainingSectionsMapSchema,
  type TrainingSectionsMap,
} from "@/schemas/generator.schema";

type PhaseTemplates = Record<string, Record<string, unknown>>;

// Season phase -> age group -> fitness level.
const templates: Record<string, PhaseTemplates> = {
  pause: PauseJson,
  preparatory: PreparatoryJson,
  competition: CompetitionJson,
};

const FALLBACK_KEY = "preparatory/adult/advanced";
const FALLBACK_TEMPLATE = PreparatoryJson.adult.advanced;

export const parseSectionTemplate = (
  key: string,
  data: unknown,
): TrainingSectionsMap =>
  parseData(TrainingSectionsMapSchema, data, `section template ${key}`);

// One loader per key, created on first use. The generator changes the sections it gets, so callers receive a copy.
const loaders = new Map<string, () => TrainingSectionsMap>();

const loadValidated = (key: string, data: unknown): TrainingSectionsMap => {
  let load = loaders.get(key);
  if (!load) {
    load = createDataLoader(() => parseSectionTemplate(key, data), "clone");
    loaders.set(key, load);
  }
  return load();
};

export const loadSectionTemplate = (
  seasonPhase: string,
  ageGroup: string,
  level: string,
): TrainingSectionsMap => {
  const sp = seasonPhase.toLowerCase();
  // Adolescents train like adults.
  const ag =
    ageGroup.toLowerCase() === "adolescent" ? "adult" : ageGroup.toLowerCase();
  const lv = level.toLowerCase();
  const data = templates[sp]?.[ag]?.[lv];
  if (data === undefined) {
    return loadValidated(FALLBACK_KEY, FALLBACK_TEMPLATE);
  }
  return loadValidated(`${sp}/${ag}/${lv}`, data);
};
