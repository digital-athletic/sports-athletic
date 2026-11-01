import type { LevelTag, PlaceType } from "@/constants/workoutConstants";
import { loadPlanAuthoredData } from "@/data/loadPlanAuthoredData";
import { minutes } from "@/features/training/models/TimeUnits";
import type { FocusedTrainingDay } from "@/features/training/planGenerator/stages/dayGroupingAndFocus";
import type {
  MaximumMinutesTable,
  PriorityStructure,
  SkillBudgetContext,
} from "@/features/training/planGenerator/stages/skillBudget";
import type {
  MaxMinutesGroup,
  SkillPriorities,
} from "@/schemas/generator.schema";
import type { PlacesData } from "@/store/placesStore";
import { generateDerivedProfile } from "./derivedProfile";
import { generateTrainingPlaces } from "./weeklySchedule";

interface FocusedTrainingDayOptions {
  readonly weekday?: number;
  readonly duration?: number;
  readonly place?: PlaceType;
  readonly focus?: FocusedTrainingDay["focus"];
}

/**
 * Builds a day of the day grouping and focus stage: a 60-minute PHASE day in
 * the studio on Monday.
 *
 * generateFocusedTrainingDay({ duration: 45, focus: "CARDIO" })
 * → { weekday: 0, duration: 45, place: "STUDIO", focus: "CARDIO" }
 */
export const generateFocusedTrainingDay = ({
  weekday = 0,
  duration = 60,
  place = "STUDIO",
  focus = "PHASE",
}: FocusedTrainingDayOptions = {}): FocusedTrainingDay => ({
  weekday,
  duration: minutes(duration),
  place,
  focus,
});

/**
 * Builds the four training places without any equipment, so no day has
 * weights.
 *
 * generateBodyweightTrainingPlaces()
 * → { HOME: { equipment: [] }, STUDIO: { equipment: [] }, ... }
 */
export const generateBodyweightTrainingPlaces = (): PlacesData => ({
  HOME: { equipment: [] },
  STUDIO: { equipment: [] },
  HALL: { equipment: [] },
  OUTSIDE: { equipment: [] },
});

/**
 * Builds the context of the skill budget stage: a 3-week hypertrophy stage 1
 * section with cardio zone 3, an adult advanced athlete without pain, places
 * with dumbbells and the real authored data.
 *
 * generateSkillBudgetContext({ section: { type: "SK", numOfWeeks: 2, cardioType: "CARDIO_1_SHORT" } })
 * → { section: { type: "SK", ... }, profile: { ageGroup: "ADULT", ... },
 *     trainingPlaces: { HOME: { equipment: ["DUMBBELL"] }, ... }, authoredData }
 */
export const generateSkillBudgetContext = (
  overrides: Partial<SkillBudgetContext> = {},
): SkillBudgetContext => ({
  section: { type: "SWR1", numOfWeeks: 3, cardioType: "CARDIO_3" },
  profile: generateDerivedProfile(),
  trainingPlaces: generateTrainingPlaces(),
  authoredData: loadPlanAuthoredData(),
  ...overrides,
});

/**
 * Builds the real skill priorities with the given structure for adults with
 * pain on PHASE days.
 *
 * generateSkillPrioritiesWithAdultPainPhase({ "0": ["PHASE", "PREV1"] })
 * → { CHILD: ..., ADULT: { pain: { ..., phase: { "0": ["PHASE", "PREV1"] } }, noPain: ... } }
 */
export const generateSkillPrioritiesWithAdultPainPhase = (
  phase: PriorityStructure,
): SkillPriorities => {
  const { skillPriorities } = loadPlanAuthoredData();
  return {
    ...skillPriorities,
    ADULT: {
      ...skillPriorities.ADULT,
      pain: { ...skillPriorities.ADULT.pain, phase },
    },
  };
};

/**
 * Builds the real maximum minutes table with the minutes of one group
 * replaced.
 *
 * generateMaximumMinutesTable("SWR", { ADVANCED: 0 })
 * → { ..., SWR: { BEGINNER: 35, ADVANCED: 0, PROFESSIONAL: 60 }, ... }
 */
export const generateMaximumMinutesTable = (
  group: MaxMinutesGroup,
  levelMinutes: Partial<Record<LevelTag, number>>,
): MaximumMinutesTable => {
  const { maxMinutes } = loadPlanAuthoredData();
  return { ...maxMinutes, [group]: { ...maxMinutes[group], ...levelMinutes } };
};

/**
 * Builds the real maximum minutes table without the entry of one group.
 *
 * generateMaximumMinutesTableWithoutGroup("SWR")
 * → { BAS: ..., CARDIO: ..., ..., WUSPEZIAL: ... } (no SWR)
 */
export const generateMaximumMinutesTableWithoutGroup = (
  group: MaxMinutesGroup,
): MaximumMinutesTable =>
  Object.fromEntries(
    Object.entries(loadPlanAuthoredData().maxMinutes).filter(
      ([key]) => key !== group,
    ),
  );
