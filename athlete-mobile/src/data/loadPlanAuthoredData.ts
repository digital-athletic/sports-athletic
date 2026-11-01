import CompetitionJson from "../../assets/data/generator/trainingSections/competition.json";
import PauseJson from "../../assets/data/generator/trainingSections/pause.json";
import PreparatoryJson from "../../assets/data/generator/trainingSections/preparatory.json";
import RegionsData from "../../assets/data/generator/regions.json";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  DirectionsByRegion,
  MaxMinutes,
  RegionConfig,
  SkillPriorities,
  TrainingSectionsMap,
} from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { createDataLoader } from "./createDataLoader";
import { getAllExercises } from "./exerciseRegistry";
import { loadDirections } from "./loadDirections";
import { loadMaxMinutes } from "./loadMaxMinutes";
import { parseRegionConfig } from "./loadRegionConfig";
import { parseSectionTemplate } from "./loadSectionTemplates";
import { loadSkillCatalog } from "./loadSkillCatalog";
import { loadSkillPriorities } from "./loadSkillPriorities";
import { getAllSkillTrees } from "./skillTreeRegistry";

/** Section templates by season phase, age group and fitness level, all lower case as authored. */
export type SectionTemplates = Readonly<
  Record<
    string,
    Readonly<Record<string, Readonly<Record<string, TrainingSectionsMap>>>>
  >
>;

/** The authored data plan creation reads. */
export interface PlanAuthoredData {
  readonly sectionTemplates: SectionTemplates;
  readonly skillPriorities: SkillPriorities;
  readonly maxMinutes: MaxMinutes;
  readonly regionConfigs: Readonly<Record<string, RegionConfig>>;
  readonly movementDirections: DirectionsByRegion;
  /** The pain regions each prevention skill covers, by skill code. */
  readonly preventionRegions: Readonly<Record<string, readonly string[]>>;
  readonly skillTrees: Readonly<Record<string, SkillTreeType>>;
  readonly exerciseCatalog: readonly ExerciseType[];
}

const SECTION_TEMPLATE_FILES: Record<
  string,
  Record<string, Record<string, unknown>>
> = {
  pause: PauseJson,
  preparatory: PreparatoryJson,
  competition: CompetitionJson,
};

const REGION_CONFIG_FILE: Record<string, unknown> = RegionsData;

const mapValues = <T, R>(
  record: Record<string, T>,
  map: (value: T, key: string) => R,
): Record<string, R> =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, map(value, key)]),
  );

// Only prevention skills name pain regions in the skill catalog.
const collectPreventionRegions = (): Record<string, readonly string[]> =>
  Object.fromEntries(
    Object.entries(loadSkillCatalog()).flatMap(([skill, entry]) =>
      entry.painRegions ? [[skill, [...entry.painRegions]]] : [],
    ),
  );

const parseSectionTemplates = (): SectionTemplates =>
  mapValues(SECTION_TEMPLATE_FILES, (ageGroups, seasonPhase) =>
    mapValues(ageGroups, (levels, ageGroup) =>
      mapValues(levels, (template, level) =>
        parseSectionTemplate(`${seasonPhase}/${ageGroup}/${level}`, template),
      ),
    ),
  );

// The configurations never change at runtime, so they parse once and stay deep frozen.
const loadPlanConfigurations = createDataLoader(
  () => ({
    sectionTemplates: parseSectionTemplates(),
    skillPriorities: loadSkillPriorities(),
    maxMinutes: loadMaxMinutes(),
    regionConfigs: mapValues(REGION_CONFIG_FILE, parseRegionConfig),
    movementDirections: loadDirections(),
    preventionRegions: collectPreventionRegions(),
  }),
  "frozen",
);

/**
 * Loads the authored data of plan creation. The skill trees and the exercise
 * catalog come from the registries, which the old generator shares, so they
 * stay unfrozen.
 */
export const loadPlanAuthoredData = (): PlanAuthoredData => ({
  ...loadPlanConfigurations(),
  skillTrees: getAllSkillTrees(),
  exerciseCatalog: getAllExercises(),
});
