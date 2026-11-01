/**
 * Reads the hand-derived day focus golden table, so a spec can run day
 * grouping and focus on every case and compare the focus per day. The table
 * stays the only source of the cases; this module only parses its notation.
 */
import fs from "node:fs";
import path from "node:path";
import {
  type AgeGroupTag,
  isLevelTag,
  type PlaceType,
} from "@/constants/workoutConstants";
import type { PlanGenerationInput } from "@/features/training/planGenerator/planGenerationInput/planGenerationInput";
import type { FocusedTrainingDay } from "@/features/training/planGenerator/stages/dayGroupingAndFocus";
import type { DerivedProfile } from "@/features/training/planGenerator/stages/profileDerivation";
import { generateDerivedProfile } from "../../factories/derivedProfile";
import {
  generateScheduledPlanGenerationInput,
  type ScheduledTrainingDay,
} from "../../factories/weeklySchedule";

export interface DayFocusCase {
  readonly name: string;
  readonly input: PlanGenerationInput;
  readonly profile: DerivedProfile;
  /** The `out: focus per day` cell, such as "Mon PHASE, Tue CARDIO". */
  readonly expectedFocusPerDay: string;
}

const TABLE_PATH = path.join(__dirname, "__golden__", "day-focus.md");
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AGE_GROUP_BY_NAME: Record<string, AgeGroupTag> = {
  child: "CHILD",
  adolescent: "ADOLESCENT",
  adult: "ADULT",
};
const PLACE_BY_NAME: Record<string, PlaceType> = {
  home: "HOME",
  studio: "STUDIO",
  hall: "HALL",
  outside: "OUTSIDE",
};
// "Mon studio 60 min run equipment" or "Wed home 45 min no run equipment"
const SCHEDULED_DAY_PATTERN =
  /^(\w{3}) (\w+) (\d+) min (run equipment|no run equipment)$/;

const fail = (message: string): never => {
  throw new Error(`day-focus.md: ${message}`);
};

const readCells = (line: string): string[] =>
  line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());

// "adult, advanced" → ADULT at fitness level ADVANCED; "child" → CHILD.
const parseProfile = (athlete: string): DerivedProfile => {
  const [ageGroupName, levelName] = athlete.split(", ");
  const ageGroup =
    AGE_GROUP_BY_NAME[ageGroupName] ?? fail(`unknown athlete "${athlete}"`);
  const level = levelName?.toUpperCase();
  if (level === undefined) return generateDerivedProfile({ ageGroup });
  return isLevelTag(level)
    ? generateDerivedProfile({ ageGroup, fitnessLevel: level })
    : fail(`unknown level in "${athlete}"`);
};

interface ParsedDay {
  readonly day: ScheduledTrainingDay;
  readonly hasRunEquipment: boolean;
}

const parseScheduledDay = (entry: string): ParsedDay => {
  const match = SCHEDULED_DAY_PATTERN.exec(entry);
  if (!match) return fail(`unreadable schedule entry "${entry}"`);
  const [, weekdayName, placeName, duration, equipment] = match;
  const weekday = WEEKDAY_NAMES.indexOf(weekdayName);
  const place = PLACE_BY_NAME[placeName];
  if (weekday < 0 || place === undefined) {
    return fail(`unknown weekday or place in "${entry}"`);
  }
  return {
    day: { weekday, place, duration: Number(duration) },
    hasRunEquipment: equipment === "run equipment",
  };
};

const placesWithRunEquipmentOf = (days: readonly ParsedDay[]): PlaceType[] => {
  const runEquipmentByPlace = new Map<PlaceType, boolean>();
  for (const { day, hasRunEquipment } of days) {
    if (runEquipmentByPlace.get(day.place) === !hasRunEquipment) {
      fail(`${day.place} has and lacks run equipment in one case`);
    }
    runEquipmentByPlace.set(day.place, hasRunEquipment);
  }
  return [...runEquipmentByPlace]
    .filter(([, hasRunEquipment]) => hasRunEquipment)
    .map(([place]) => place);
};

const parseCase = (line: string): DayFocusCase => {
  const [name, athlete, schedule, expectedFocusPerDay] = readCells(line);
  const days = schedule.split(", ").map(parseScheduledDay);
  return {
    name,
    input: generateScheduledPlanGenerationInput(
      days.map(({ day }) => day),
      placesWithRunEquipmentOf(days),
    ),
    profile: parseProfile(athlete),
    expectedFocusPerDay,
  };
};

/** Every case of the table, in table order. */
export const readDayFocusCases = (): DayFocusCase[] =>
  fs
    .readFileSync(TABLE_PATH, "utf8")
    .trim()
    .split("\n")
    .slice(2)
    .map(parseCase);

/** Writes the focus per day in the table notation, Monday first. */
export const formatFocusPerDay = (
  days: readonly FocusedTrainingDay[],
): string =>
  [...days]
    .sort((first, second) => first.weekday - second.weekday)
    .map((day) => `${WEEKDAY_NAMES[day.weekday]} ${day.focus}`)
    .join(", ");
