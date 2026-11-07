import { type LevelTag, WorkoutConstants } from "@/constants/workoutConstants";
import type { PlanAuthoredData } from "@/data/loadPlanAuthoredData";
import {
  type DurationMinutes,
  minutes,
} from "@/features/training/models/TimeUnits";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import type {
  MaxMinutesGroup,
  SkillCode,
  SkillPriorities,
} from "@/schemas/generator.schema";
import type { PlacesData } from "@/store/placesStore";
import { mapReduce } from "@/utils/functional";
import { throwConfigurationError } from "./configurationError";
import type { Focus, FocusedTrainingDay } from "./dayGroupingAndFocus";
import { readPlaceEquipment } from "./placeEquipment";
import type { DerivedProfile } from "./profileDerivation";
import { readRegionConfigurationVariant } from "./regionConfiguration";
import type { PlanSection, SectionType } from "./sectionLayout";
import { isCardioSkill, SPECIAL_WARM_UP } from "./skillCodes";

/**
 * Maximum minutes per skill group and fitness level. The authored table holds
 * every entry; the stage still checks each lookup and raises a configuration
 * error for a missing one.
 */
export type MaximumMinutesTable = Readonly<
  Partial<Record<MaxMinutesGroup, Readonly<Partial<Record<LevelTag, number>>>>>
>;

/** What the skill budget reads for the days of one section. */
export interface SkillBudgetContext {
  readonly section: PlanSection;
  readonly profile: DerivedProfile;
  readonly trainingPlaces: PlacesData;
  readonly authoredData: Pick<
    PlanAuthoredData,
    "skillPriorities" | "regionConfigs"
  > & { readonly maxMinutes: MaximumMinutesTable };
}

/** The minutes one skill gets on a training day. */
export interface SkillMinuteBudget {
  readonly skill: SkillCode;
  readonly minutes: DurationMinutes;
}

/** The skills of a training day with their minutes, in priority order. */
export interface TrainingDayBudget {
  readonly day: FocusedTrainingDay;
  readonly skills: readonly SkillMinuteBudget[];
}

/** One step of the prevention rotation fold over the days of a section. */
export interface TrainingDayBudgetStep {
  readonly budget: TrainingDayBudget;
  /** The index into the athlete's prevention skills for the next day. */
  readonly nextRotationCursor: number;
}

/** Minute thresholds mapped to the skill slots that apply from there on. */
export type PriorityStructure = NonNullable<
  SkillPriorities["ADULT"]["pain"]["phase"]
>;
type PrioritySlot = PriorityStructure[string][number];
type StructureKey = keyof SkillPriorities["ADULT"]["pain"];

const { AGE_GROUPS } = WorkoutConstants;

const STRUCTURE_KEYS: Readonly<Record<Focus, StructureKey>> = {
  PHASE: "phase",
  CARDIO: "cardio",
  STABILITY: "stability",
  COMBINED: "combined",
};
const PREVENTION_SLOTS: readonly PrioritySlot[] = [
  "PREV",
  "PREV1",
  "PREV2",
  "PREV3",
];
const BODYWEIGHT_SECTION_TYPES: Readonly<Record<SectionType, SkillCode>> = {
  SWR1: "SWR1KG",
  SWR1KG: "SWR1KG",
  SWR2: "SWR2KG",
  SWR2KG: "SWR2KG",
  MAX: "SWR2KG",
  MAX_STRENGTH: "SWR2KG",
  SK: "SKKG",
  SKKG: "SKKG",
  SA: "SAKG",
  SAKG: "SAKG",
};

/**
 * The glossary gives the speed warm-up to every explosive power and power
 * endurance section. The old code gives it to SA and SK only:
 * generators/PlanGenerator.ts, PlanGenerator.getSkillTrainingplan
 */
const SPEED_WARM_UP_SECTION_TYPES: readonly SectionType[] = [
  "SA",
  "SAKG",
  "SK",
  "SKKG",
];
const MAXIMUM_MINUTES_GROUPS: Readonly<
  Partial<Record<string, MaxMinutesGroup>>
> = {
  BAS: "BAS",
  GKS: "GKS",
  MAX: "MAX",
  MAX_STRENGTH: "MAX",
  SA: "SA",
  SAKG: "SA",
  SK: "SK",
  SKKG: "SK",
  SWR1: "SWR",
  SWR1KG: "SWR",
  SWR2: "SWR",
  SWR2KG: "SWR",
  [SPECIAL_WARM_UP]: "WUSPEZIAL",
};

const isPreventionSlot = (slot: PrioritySlot): boolean =>
  PREVENTION_SLOTS.includes(slot);

const pickPriorityStructure = (
  { ageGroup, hasPain }: DerivedProfile,
  focus: Focus,
  skillPriorities: SkillPriorities,
): PriorityStructure => {
  const ageKey = ageGroup === AGE_GROUPS.CHILD ? "CHILD" : "ADULT";
  const painKey = hasPain ? "pain" : "noPain";
  const structureKey = STRUCTURE_KEYS[focus];
  return (
    skillPriorities[ageKey][painKey][structureKey] ??
    throwConfigurationError("skillPriorities", ageKey, painKey, structureKey)
  );
};

/**
 * A slot list applies to sessions longer than its minute threshold, as in the
 * old block loop, so a 60-minute session gets no slot from the 60 entry.
 */
const collectSlots = (
  structure: PriorityStructure,
  duration: number,
): PrioritySlot[] =>
  Object.entries(structure)
    .map(([threshold, slots]) => ({ threshold: Number(threshold), slots }))
    .filter(({ threshold }) => duration > threshold)
    .sort((first, second) => first.threshold - second.threshold)
    .flatMap(({ slots }) => slots);

const resolvePlaceholder = (
  slot: PrioritySlot,
  { type, cardioType }: PlanSection,
  hasWeightsAtPlace: boolean,
): SkillCode => {
  if (slot === "PHASE") {
    return hasWeightsAtPlace ? type : BODYWEIGHT_SECTION_TYPES[type];
  }
  if (slot === "HBCARDIO") return cardioType;
  if (slot === "WU" && SPEED_WARM_UP_SECTION_TYPES.includes(type)) {
    return "WUSKSA";
  }
  return slot;
};

/**
 * The first prevention slot of the day takes the prevention skill at the
 * cursor; further prevention slots drop. Without a prevention skill the day
 * drops the special warm-up and leaves the cursor where it is. The old code
 * advances the cursor for a prevention or special warm-up slot at any
 * threshold, including one the session never reaches, and gives a child without
 * a prevention skill stability for PREV2 and PREV3:
 * generators/PlanGenerator.ts, PlanGenerator.createSection and
 * PlanGenerator.replaceUserSpecificSkill
 */
const resolveSlots = (
  slots: readonly PrioritySlot[],
  { section, profile }: SkillBudgetContext,
  hasWeightsAtPlace: boolean,
  rotationCursor: number,
): { skills: SkillCode[]; nextRotationCursor: number } => {
  const { preventionSkills } = profile;
  const preventionIndex =
    preventionSkills.length > 0 ? slots.findIndex(isPreventionSlot) : -1;
  const hasPrevention = preventionIndex >= 0;
  const skills = slots.flatMap((slot, index): SkillCode[] => {
    if (isPreventionSlot(slot)) {
      return index === preventionIndex
        ? [preventionSkills[rotationCursor % preventionSkills.length]]
        : [];
    }
    if (slot === SPECIAL_WARM_UP && !hasPrevention) return [];
    return [resolvePlaceholder(slot, section, hasWeightsAtPlace)];
  });
  return {
    skills: [...new Set(skills)],
    nextRotationCursor: hasPrevention
      ? (rotationCursor + 1) % preventionSkills.length
      : rotationCursor,
  };
};

/** The smallest minute key of the skill's region configuration. */
const readMinimumMinutes = (
  skill: SkillCode,
  { profile, authoredData }: SkillBudgetContext,
): number =>
  Math.min(
    ...Object.keys(
      readRegionConfigurationVariant(
        skill,
        profile,
        authoredData.regionConfigs,
      ),
    ).map(Number),
  );

const findMaximumMinutesGroup = (skill: SkillCode): MaxMinutesGroup => {
  if (isCardioSkill(skill)) return "CARDIO";
  if (skill.startsWith("PREV")) return "PREV";
  return MAXIMUM_MINUTES_GROUPS[skill] ?? "DEFAULT";
};

/**
 * A 0 means the skill gets no leftover minutes, and a missing entry raises a
 * configuration error. The old code reads both as 200 minutes:
 * generators/PlanGenerator.ts, PlanGenerator.getMaxTimeForSkillAndLevel
 */
const readMaximumMinutes = (
  skill: SkillCode,
  { profile, authoredData }: SkillBudgetContext,
): number => {
  const group = findMaximumMinutesGroup(skill);
  const level = profile.fitnessLevel;
  return (
    authoredData.maxMinutes[group]?.[level] ??
    throwConfigurationError("maxMinutes", group, level)
  );
};

/**
 * Each skill gets its minimum, and the leftover minutes fill the skills in
 * priority order up to their maximum minutes. Minutes no skill can take stay
 * unused. The old code first fills the priority 2 skill to its maximum in
 * sessions longer than 45 minutes:
 * generators/PlanGenerator.ts, PlanGenerator.addTimeLeftToSkills
 */
const distributeMinutes = (
  skills: readonly SkillCode[],
  duration: number,
  context: SkillBudgetContext,
): SkillMinuteBudget[] => {
  const minimums = skills.map((skill) => ({
    skill,
    minimum: readMinimumMinutes(skill, context),
  }));
  const leftover = minimums.reduce(
    (rest, { minimum }) => rest - minimum,
    duration,
  );
  const [budgets] = mapReduce(
    minimums,
    leftover,
    ({ skill, minimum }, rest) => {
      const room = readMaximumMinutes(skill, context) - minimum;
      const added = Math.max(0, Math.min(rest, room));
      return [
        { skill, minutes: minutes(minimum + added) },
        rest - added,
      ] as const;
    },
  );
  return budgets;
};

/**
 * Budgets the skills of one training day, as spec section 4 defines. Picks the
 * skill priority structure by age group, pain status and focus, resolves the
 * placeholders for the section and the day's place, places the prevention
 * skill at the rotation cursor and distributes the day's minutes. The step is
 * pure, so a test can start it from any rotation cursor. A missing structure,
 * region configuration or maximum minutes entry raises the configuration error
 * OTHER/OTHER.
 *
 * budgetTrainingDay(kneeAndShoulderPainInHypertrophyStage1, mondayStudioPhase45, 1)
 * → { budget: { day, skills: [{ skill: "SWR1", minutes: 27 },
 *     { skill: "PREVSHOULDER", minutes: 5 }, { skill: "WUSPEZIAL", minutes: 3 },
 *     { skill: "MOB", minutes: 5 }, { skill: "WU", minutes: 5 }] },
 *     nextRotationCursor: 0 }
 */
export const budgetTrainingDay = (
  context: SkillBudgetContext,
  day: FocusedTrainingDay,
  rotationCursor: number,
): TrainingDayBudgetStep => {
  const structure = pickPriorityStructure(
    context.profile,
    day.focus,
    context.authoredData.skillPriorities,
  );
  const { skills, nextRotationCursor } = resolveSlots(
    collectSlots(structure, day.duration),
    context,
    hasWeights(readPlaceEquipment(context.trainingPlaces, day.place)),
    rotationCursor,
  );
  return {
    budget: { day, skills: distributeMinutes(skills, day.duration, context) },
    nextRotationCursor,
  };
};

/**
 * Budgets the skills of every training day of one section. Walks the days in
 * the given order as a fold: the prevention rotation starts at the first
 * prevention skill and each day passes its next cursor on.
 *
 * budgetSectionDays(kneeAndShoulderPainInHypertrophyStage1, groups.flat())
 * → [{ day: monday, skills: [SWR1, PREVKNEE, ...] },
 *    { day: wednesday, skills: [SWR1, PREVSHOULDER, ...] }]
 */
export const budgetSectionDays = (
  context: SkillBudgetContext,
  days: readonly FocusedTrainingDay[],
): readonly TrainingDayBudget[] => {
  const [budgets] = mapReduce(days, 0, (day, rotationCursor) => {
    const step = budgetTrainingDay(context, day, rotationCursor);
    return [step.budget, step.nextRotationCursor] as const;
  });
  return budgets;
};
