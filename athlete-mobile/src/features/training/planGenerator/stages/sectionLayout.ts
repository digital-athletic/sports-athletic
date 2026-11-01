import { WorkoutConstants } from "@/constants/workoutConstants";
import type { SectionTemplates } from "@/data/loadPlanAuthoredData";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type {
  SectionEntry,
  TrainingSectionsMap,
} from "@/schemas/generator.schema";
import type { DerivedProfile } from "./profileDerivation";

/** One section of the plan: type, week count and cardio type, without a start date. */
export type PlanSection = Readonly<SectionEntry>;
export type SectionType = SectionEntry["type"];
export type CardioType = SectionEntry["cardioType"];

const { AGE_GROUPS, LEVELS } = WorkoutConstants;
const TEMPLATE_WEEK_LIMIT = 20;
const FALLBACK_TEMPLATE_KEY = "preparatory/adult/advanced";

const MAX_STRENGTH_TYPES: readonly SectionType[] = ["MAX", "MAX_STRENGTH"];
const GOALKEEPER_SECTION_TYPES: Partial<Record<SectionType, SectionType>> = {
  SA: "SK",
  SAKG: "SKKG",
};
const GOALKEEPER_CARDIO_TYPES: Partial<Record<CardioType, CardioType>> = {
  CARDIO_1_LAKTAT: "CARDIO_1_SHORT",
};

const throwMissingTemplate = (templateKey: string, weeks: number): never => {
  throw {
    type: "OTHER",
    subtype: "OTHER",
    params: ["sectionTemplate", templateKey, String(weeks)],
  } satisfies GeneratorError;
};

interface FoundTemplate {
  readonly key: string;
  readonly template: TrainingSectionsMap;
}

const readTemplate = (
  sectionTemplates: SectionTemplates,
  key: string,
): TrainingSectionsMap | undefined => {
  const [seasonPhase, ageGroup, level] = key.split("/");
  return sectionTemplates[seasonPhase]?.[ageGroup]?.[level];
};

// Templates are authored in lower case; adolescents train like adults.
const findSectionTemplate = (
  { ageGroup, fitnessLevel, seasonPhase }: DerivedProfile,
  sectionTemplates: SectionTemplates,
): FoundTemplate => {
  const templateAgeGroup = ageGroup === AGE_GROUPS.CHILD ? "child" : "adult";
  const key =
    `${seasonPhase.type}/${templateAgeGroup}/${fitnessLevel}`.toLowerCase();
  const template = readTemplate(sectionTemplates, key);
  if (template) return { key, template };
  const fallback = readTemplate(sectionTemplates, FALLBACK_TEMPLATE_KEY);
  return fallback
    ? { key: FALLBACK_TEMPLATE_KEY, template: fallback }
    : throwMissingTemplate(FALLBACK_TEMPLATE_KEY, seasonPhase.weekCount);
};

const readTemplateSections = (
  { key, template }: FoundTemplate,
  weeks: number,
): readonly SectionEntry[] =>
  template[String(weeks)] ?? throwMissingTemplate(key, weeks);

// Appends repeat sections cyclically until the extra weeks are used up. The
// last appended section takes only the weeks left. A section with the type and
// cardio type of the one before it extends that section instead.
const appendRepeatSections = (
  sections: readonly SectionEntry[],
  repeat: readonly SectionEntry[],
  extraWeeks: number,
): SectionEntry[] => {
  const result = sections.map((section) => ({ ...section }));
  let remainingWeeks = extraWeeks;
  for (let index = 0; remainingWeeks > 0 && repeat.length > 0; index++) {
    const next = repeat[index % repeat.length];
    const weeks = Math.min(next.numOfWeeks, remainingWeeks);
    remainingWeeks -= weeks;
    const previous = result.at(-1);
    if (
      previous?.type === next.type &&
      previous.cardioType === next.cardioType
    ) {
      previous.numOfWeeks += weeks;
    } else {
      result.push({ ...next, numOfWeeks: weeks });
    }
  }
  return result;
};

const pickTemplateSections = (
  found: FoundTemplate,
  weekCount: number,
): readonly SectionEntry[] => {
  if (weekCount <= TEMPLATE_WEEK_LIMIT) {
    return readTemplateSections(found, weekCount);
  }
  return appendRepeatSections(
    readTemplateSections(found, TEMPLATE_WEEK_LIMIT),
    found.template.repeat ?? [],
    weekCount - TEMPLATE_WEEK_LIMIT,
  );
};

const substituteSection = (
  section: SectionEntry,
  { ageGroup, fitnessLevel, hasWeights, playingPositionGroup }: DerivedProfile,
): PlanSection => {
  const replacesMaxStrength =
    !hasWeights ||
    fitnessLevel === LEVELS.BEGINNER ||
    ageGroup === AGE_GROUPS.CHILD;
  const isGoalkeeper = playingPositionGroup === "GOALKEEPER";
  let { type, cardioType } = section;
  if (replacesMaxStrength && MAX_STRENGTH_TYPES.includes(type)) type = "SWR2";
  if (isGoalkeeper) {
    type = GOALKEEPER_SECTION_TYPES[type] ?? type;
    cardioType = GOALKEEPER_CARDIO_TYPES[cardioType] ?? cardioType;
  }
  return { ...section, type, cardioType };
};

/**
 * Lays out the sections of spec section 2. Picks the section template by
 * season phase, age group and fitness level, with the preparatory adult
 * advanced template as fallback. Phases longer than 20 weeks append from the
 * template's repeat list. Without weights, for beginners and for children max
 * strength becomes hypertrophy stage 2. Goalkeepers get explosive power
 * instead of power endurance and sprint intervals instead of lactate
 * intervals. The sections carry no start date; plan assembly dates them. A
 * missing template raises the configuration error OTHER/OTHER.
 *
 * layOutSections(beginnerWithEightPreparatoryWeeks, sectionTemplates)
 * → [{ type: "SWR1", numOfWeeks: 3, cardioType: "CARDIO_3" },
 *    { type: "SWR2", numOfWeeks: 3, cardioType: "CARDIO_2" },
 *    { type: "SK", numOfWeeks: 2, cardioType: "CARDIO_1_SHORT" }]
 */
export const layOutSections = (
  profile: DerivedProfile,
  sectionTemplates: SectionTemplates,
): readonly PlanSection[] =>
  pickTemplateSections(
    findSectionTemplate(profile, sectionTemplates),
    profile.seasonPhase.weekCount,
  ).map((section) => substituteSection(section, profile));
