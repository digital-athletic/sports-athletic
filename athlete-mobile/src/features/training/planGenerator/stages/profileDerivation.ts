import { isGoalkeeperPosition } from "@/constants/sportPositions";
import { TagGroups } from "@/constants/tagGroups";
import {
  type AgeGroupTag,
  isLevelTag,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import { getPreventionsFromPains } from "@/features/training/utils/painUtils";
import { type ISODateString, isISODate } from "@/utils/date";
import { getUserTagValue, getUserTagValues } from "@/utils/tagUtils";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";

export type SeasonPhaseName = NonNullable<SeasonPhaseType["type"]>;

/** Goalkeepers form one group; every other position, or none, is a field player. */
export type PlayingPositionGroup = "GOALKEEPER" | "FIELD_PLAYER";

export interface DerivedSeasonPhase {
  readonly type: SeasonPhaseName;
  /** Full weeks from the plan start to the phase end, at least 1. */
  readonly weekCount: number;
}

/** The profile facts of spec section 1 that the later stages read. */
export interface DerivedProfile {
  readonly ageGroup: AgeGroupTag;
  readonly fitnessLevel: LevelTag;
  /** True when a pain tag maps to a prevention skill. */
  readonly hasPain: boolean;
  readonly preventionSkills: readonly string[];
  readonly playingPositionGroup: PlayingPositionGroup;
  readonly seasonPhase: DerivedSeasonPhase;
  /** True when the training place of any active day has weights. */
  readonly hasWeights: boolean;
}

const { AGE_GROUPS, AGE_GROUPS_MAX_AGE, LEVELS } = WorkoutConstants;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

// The date on which an athlete born on the birthday turns the given age.
// Both dates are ISO strings, so they compare in calendar order.
const dateOfAge = (birthday: ISODateString, age: number): ISODateString =>
  `${Number(birthday.slice(0, 4)) + age}${birthday.slice(4)}`;

const deriveAgeGroup = (
  birthday: string,
  referenceDate: ISODateString,
): AgeGroupTag => {
  if (!isISODate(birthday)) return AGE_GROUPS.ADULT;
  if (referenceDate < dateOfAge(birthday, AGE_GROUPS_MAX_AGE.CHILD)) {
    return AGE_GROUPS.CHILD;
  }
  if (referenceDate < dateOfAge(birthday, AGE_GROUPS_MAX_AGE.ADOLESCENT)) {
    return AGE_GROUPS.ADOLESCENT;
  }
  return AGE_GROUPS.ADULT;
};

const deriveFitnessLevel = (
  levelTag: string | undefined,
  ageGroup: AgeGroupTag,
): LevelTag => {
  const level = isLevelTag(levelTag) ? levelTag : LEVELS.BEGINNER;
  return level === LEVELS.PROFESSIONAL && ageGroup === AGE_GROUPS.CHILD
    ? LEVELS.ADVANCED
    : level;
};

const toUtcDay = (date: ISODateString): number => {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_IN_MS;
};

const deriveSeasonPhase = (
  { type, endDate }: SeasonPhaseType,
  planStartDate: ISODateString,
): DerivedSeasonPhase => {
  if (type === null || !isISODate(endDate)) {
    throw {
      type: "NO_ANAMNESIS",
      subtype: "MISSING_WORKOUT_DATA",
      params: ["seasonPhase"],
    } satisfies GeneratorError;
  }
  const days = toUtcDay(endDate) - toUtcDay(planStartDate);
  return { type, weekCount: Math.max(1, Math.floor(days / DAYS_PER_WEEK)) };
};

const hasWeightsOnActiveDay = ({
  weeklySchedule,
  trainingPlaces,
}: PlanGenerationInput): boolean =>
  weeklySchedule.some(
    (day) =>
      day.active && hasWeights(trainingPlaces[day.place]?.equipment ?? []),
  );

/**
 * Derives the profile facts of spec section 1 from the anamnesis. The age
 * group counts to the reference date of the input, and the season phase weeks
 * count from the plan start date, so the result never depends on the clock.
 * A season phase without a type or end date raises the input error
 * NO_ANAMNESIS/MISSING_WORKOUT_DATA.
 *
 * deriveAthleteProfile(inputOfAProfessionalChildGoalkeeperWithKneePain)
 * → { ageGroup: "CHILD", fitnessLevel: "ADVANCED", hasPain: true,
 *     preventionSkills: ["PREVKNEE"], playingPositionGroup: "GOALKEEPER",
 *     seasonPhase: { type: "PREPARATORY", weekCount: 17 }, hasWeights: true }
 */
export const deriveAthleteProfile = (
  input: PlanGenerationInput,
): DerivedProfile => {
  const { personalData, workoutData } = input.athlete;
  const tags = workoutData.tags;
  const ageGroup = deriveAgeGroup(personalData.birthday, input.referenceDate);
  const preventionSkills = getPreventionsFromPains(
    getUserTagValues(tags, TagGroups.PAIN),
  );
  return {
    ageGroup,
    fitnessLevel: deriveFitnessLevel(
      getUserTagValue(tags, TagGroups.LEVEL),
      ageGroup,
    ),
    hasPain: preventionSkills.length > 0,
    preventionSkills,
    playingPositionGroup: isGoalkeeperPosition(
      getUserTagValue(tags, TagGroups.POSITION),
    )
      ? "GOALKEEPER"
      : "FIELD_PLAYER",
    seasonPhase: deriveSeasonPhase(input.seasonPhase, input.planStartDate),
    hasWeights: hasWeightsOnActiveDay(input),
  };
};
