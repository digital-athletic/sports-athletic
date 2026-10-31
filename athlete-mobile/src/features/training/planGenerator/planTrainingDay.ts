import {
  type AgeGroupTag,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { loadMaxMinutes } from "@/data/loadMaxMinutes";
import { loadRegionConfig } from "@/data/loadRegionConfig";
import { readSkillSetListKind } from "@/features/training/workoutGenerator/stages/setListBuilding";
import type {
  DurationTagMap,
  MaxMinutesGroup,
  RegionTagEntry,
} from "@/schemas/generator.schema";
import { estimateSkillSeconds } from "./durationEstimate";
import { drawTrainingDay, type SkillSteps } from "./trainingDayDraw";

/** The skills of a training day in priority order and the day's frame. */
interface PlanTrainingDayInput {
  skills: string[];
  durationMinutes: number;
  level: LevelTag;
  ageGroup: AgeGroupTag;
  fillFirst?: string;
}

/**
 * The region table entries and the length of each skill: the region table key
 * of the chosen step, or the drawn minutes of a cardio skill.
 */
interface TrainingDayPlan {
  tagsPerSkill: Record<string, readonly RegionTagEntry[]>;
  timePerSkill: Record<string, number>;
}

const TIMED_STEP_MINUTES = 1;
// maxMinutes.json sets 0 for a level without a cap; the planner then caps the skill at 200 minutes.
export const UNCAPPED_MINUTES = 200;

// Skills with a region table of their own. The planner applies the SWR1 table
// to every other skill except cardio and max strength.
const OWN_REGION_SKILLS = new Set([
  "BAS",
  "BR",
  "CD",
  "GKS",
  "MOB",
  "PREVANKLE",
  "PREVKNEE",
  "PREVSHOULDER",
  "PREVSPINE",
  "PREVWRIST",
  "SA",
  "SAKG",
  "SK",
  "SKKG",
  "SWR1",
  "SWR1KG",
  "SWR2KG",
  "WU",
  "WUSKSA",
  "WUSPEZIAL",
]);

const MAX_MINUTES_GROUPS: Record<string, MaxMinutesGroup> = {
  BAS: "BAS",
  GKS: "GKS",
  PREV: "PREV",
  PREVKNEE: "PREV",
  PREVSHOULDER: "PREV",
  PREVWRIST: "PREV",
  PREVANKLE: "PREV",
  PREVSPINE: "PREV",
  SA: "SA",
  SAKG: "SA",
  SK: "SK",
  SKKG: "SK",
  SWR1: "SWR",
  SWR1KG: "SWR",
  SWR2: "SWR",
  SWR2KG: "SWR",
  WUSPEZIAL: "WUSPEZIAL",
};

const readRegionName = (skill: string): string => {
  const kind = readSkillSetListKind(skill);
  if (kind === "cardio") return "CARDIO";
  if (kind === "maxStrength") return "MAX";
  return OWN_REGION_SKILLS.has(skill) ? skill : "SWR1";
};

const readRegionTable = (
  skill: string,
  ageGroup: AgeGroupTag,
  level: LevelTag,
): DurationTagMap => {
  const region = loadRegionConfig(readRegionName(skill));
  if (ageGroup === WorkoutConstants.AGE_GROUPS.CHILD && region.child) {
    return region.child;
  }
  if (level === WorkoutConstants.LEVELS.PROFESSIONAL && region.professional) {
    return region.professional;
  }
  return region.default;
};

/**
 * Returns the cap of a skill from the maxMinutes.json group of the skill.
 *
 * readMaxMinutes("PREVKNEE", "ADVANCED") → 15
 */
export const readMaxMinutes = (skill: string, level: LevelTag): number => {
  const kind = readSkillSetListKind(skill);
  const group =
    kind === "cardio"
      ? "CARDIO"
      : kind === "maxStrength"
        ? "MAX"
        : (MAX_MINUTES_GROUPS[skill] ?? "DEFAULT");
  return loadMaxMinutes()[group][level] || UNCAPPED_MINUTES;
};

const readTableKeys = (table: DurationTagMap): number[] =>
  Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

/**
 * Returns the entries of the nearest table key at or below the minutes, so
 * cardio minutes between two table keys use the entries of the lower key.
 *
 * readEntriesAt({ "30": [a], "35": [b], "40": [c] }, 37) → [b]
 */
export const readEntriesAt = (
  table: DurationTagMap,
  minutes: number,
): readonly RegionTagEntry[] => {
  const keys = readTableKeys(table);
  const key = keys.findLast((value) => value <= minutes) ?? keys[0];
  return table[String(key)] ?? [];
};

const readStepMinutes = (
  table: DurationTagMap,
  timed: boolean,
  maxMinutes: number,
): number[] => {
  const keys = readTableKeys(table);
  if (!timed || keys.length === 0) return keys;
  const [smallest] = keys;
  const count =
    Math.floor(Math.max(0, maxMinutes - smallest) / TIMED_STEP_MINUTES) + 1;
  return Array.from(
    { length: count },
    (_, index) => smallest + index * TIMED_STEP_MINUTES,
  );
};

const readSkillSteps = (
  skill: string,
  table: DurationTagMap,
  level: LevelTag,
): SkillSteps => {
  const maxMinutes = readMaxMinutes(skill, level);
  const timed = readSkillSetListKind(skill) === "cardio";
  return {
    skill,
    maxMinutes,
    steps: readStepMinutes(table, timed, maxMinutes).map((minutes) => ({
      minutes,
      exerciseCount: readEntriesAt(table, minutes).reduce(
        (total, { count }) => total + count,
        0,
      ),
    })),
  };
};

/**
 * Picks the region table step of each skill of a training day by sharing out
 * its duration in estimated minutes. Cardio takes whole minutes from its
 * smallest table key up to its cap.
 *
 * planTrainingDay({ skills: ["MAX", "CARDIO_2"], durationMinutes: 1, level: "PROFESSIONAL", ageGroup: "ADULT" })
 * → { tagsPerSkill: { MAX: [...], CARDIO_2: [...] }, timePerSkill: { MAX: 15, CARDIO_2: 10 } }
 */
export const planTrainingDay = ({
  skills,
  durationMinutes,
  level,
  ageGroup,
  fillFirst,
}: PlanTrainingDayInput): TrainingDayPlan => {
  const tables = new Map(
    [...new Set(skills)].map((skill) => [
      skill,
      readRegionTable(skill, ageGroup, level),
    ]),
  );
  const skillSteps = [...tables].map(([skill, table]) =>
    readSkillSteps(skill, table, level),
  );
  const draw = drawTrainingDay(
    { skills: skillSteps, budgetMinutes: durationMinutes, fillFirst },
    (skill, exerciseCount, minutes) =>
      estimateSkillSeconds({ skill, level, exerciseCount, minutes }),
  );

  const plan: TrainingDayPlan = { tagsPerSkill: {}, timePerSkill: {} };
  draw.forEach(({ skill, stepMinutes }) => {
    plan.tagsPerSkill[skill] = readEntriesAt(
      tables.get(skill) ?? {},
      stepMinutes,
    );
    plan.timePerSkill[skill] = stepMinutes;
  });
  return plan;
};
