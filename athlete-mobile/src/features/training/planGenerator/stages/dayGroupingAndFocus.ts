import {
  type FocusType,
  type PlaceType,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { DurationMinutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import { hasRunEquipment } from "@/features/training/utils/equipmentUtils";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import type { DerivedProfile } from "./profileDerivation";

/** The orientation of a training day, as the glossary defines it. */
export type Focus = FocusType;

/** An active training day of the weekly schedule with its focus. */
export interface FocusedTrainingDay {
  /** 0 is Monday, 6 is Sunday. */
  readonly weekday: number;
  readonly duration: DurationMinutes;
  readonly place: PlaceType;
  readonly focus: Focus;
}

/** Consecutive active training days, in training order. */
export type TrainingDayGroup = readonly FocusedTrainingDay[];

type RunEquipmentCheck = (place: PlaceType) => boolean;

const COMBINED_MIN_DURATION = 45;
const THREE_DAY_FOCUSES: readonly Focus[] = ["PHASE", "CARDIO", "STABILITY"];

// Starts after a rest day, so a group that runs from Sunday into Monday stays
// whole. Groups are ordered by their first weekday; a group that wraps into
// Monday starts late in the week and comes last. The old code orders groups
// from the first rest day instead:
// src/features/training/generators/PlanGenerator.ts#L724-L753
const groupActiveDays = (
  schedule: readonly TrainingDayType[],
): TrainingDayType[][] => {
  const firstRestDay = schedule.findIndex((day) => !day.active);
  if (firstRestDay < 0) return schedule.length > 0 ? [[...schedule]] : [];
  const groups: TrainingDayType[][] = [];
  let group: TrainingDayType[] = [];
  for (let offset = 1; offset <= schedule.length; offset++) {
    const day = schedule[(firstRestDay + offset) % schedule.length];
    if (day.active) {
      group.push(day);
    } else if (group.length > 0) {
      groups.push(group);
      group = [];
    }
  }
  return groups.sort((first, second) => first[0].weekday - second[0].weekday);
};

const withFocus = (
  { weekday, duration, place }: TrainingDayType,
  focus: Focus,
): FocusedTrainingDay => ({ weekday, duration, place, focus });

// PHASE goes to the only studio day, else the longer day, else the only
// non-home day, else the first day.
const findTwoDayPhaseIndex = ([
  first,
  second,
]: readonly TrainingDayType[]): number => {
  const onlyIndexWhere = (
    matches: (day: TrainingDayType) => boolean,
  ): number | undefined => {
    if (matches(first) === matches(second)) return undefined;
    return matches(first) ? 0 : 1;
  };
  const studioIndex = onlyIndexWhere((day) => day.place === "STUDIO");
  if (studioIndex !== undefined) return studioIndex;
  if (first.duration !== second.duration) {
    return first.duration > second.duration ? 0 : 1;
  }
  return onlyIndexWhere((day) => day.place !== "HOME") ?? 0;
};

const assignTwoDayFocus = (
  days: readonly TrainingDayType[],
  hasRunEquipmentAt: RunEquipmentCheck,
): TrainingDayGroup => {
  const phaseIndex = findTwoDayPhaseIndex(days);
  return days.map((day, index) => {
    if (index === phaseIndex) return withFocus(day, "PHASE");
    return withFocus(
      day,
      hasRunEquipmentAt(day.place) ? "CARDIO" : "STABILITY",
    );
  });
};

const placeRank = (place: PlaceType): number => {
  if (place === "STUDIO") return 0;
  return place === "HOME" ? 2 : 1;
};

// A home day without run equipment cannot hold a cardio session.
const fitFocusToPlace = (
  focus: Focus,
  place: PlaceType,
  hasRunEquipmentAt: RunEquipmentCheck,
): Focus => {
  switch (focus) {
    case "CARDIO":
      return place === "HOME" && !hasRunEquipmentAt(place)
        ? "STABILITY"
        : "CARDIO";
    case "PHASE":
    case "STABILITY":
    case "COMBINED":
      return focus;
    default: {
      const unknownFocus: never = focus;
      return unknownFocus;
    }
  }
};

// Ranks studio days, then other non-home days, then home days, the longer day
// first within each place; the sort keeps training order on ties.
const assignThreeDayFocus = (
  days: readonly TrainingDayType[],
  hasRunEquipmentAt: RunEquipmentCheck,
): TrainingDayGroup => {
  const ranked = [...days].sort(
    (first, second) =>
      placeRank(first.place) - placeRank(second.place) ||
      second.duration - first.duration,
  );
  const focused = days.map((day) =>
    withFocus(
      day,
      fitFocusToPlace(
        THREE_DAY_FOCUSES[ranked.indexOf(day)],
        day.place,
        hasRunEquipmentAt,
      ),
    ),
  );
  if (focused.some((day) => day.focus === "CARDIO")) return focused;
  return focused.map((day) =>
    day.focus === "PHASE" ? { ...day, focus: "COMBINED" } : day,
  );
};

const assignGroupFocus = (
  days: readonly TrainingDayType[],
  hasRunEquipmentAt: RunEquipmentCheck,
): TrainingDayGroup => {
  if (days.length === 1) return [withFocus(days[0], "PHASE")];
  if (days.length === 2) return assignTwoDayFocus(days, hasRunEquipmentAt);
  if (days.length === 3) return assignThreeDayFocus(days, hasRunEquipmentAt);
  return days.map((day, index) =>
    withFocus(day, THREE_DAY_FOCUSES[index % THREE_DAY_FOCUSES.length]),
  );
};

// Converts the longest PHASE day, except a home day without run equipment,
// when the week holds more than one training day and no CARDIO day.
const applyWeeklyCardioGuarantee = (
  groups: readonly TrainingDayGroup[],
  hasRunEquipmentAt: RunEquipmentCheck,
): readonly TrainingDayGroup[] => {
  const days = groups.flat();
  if (days.length < 2 || days.some((day) => day.focus === "CARDIO")) {
    return groups;
  }
  const candidates = days.filter(
    (day) =>
      day.focus === "PHASE" &&
      (day.place !== "HOME" || hasRunEquipmentAt(day.place)),
  );
  if (candidates.length === 0) return groups;
  const longest = candidates.reduce((current, day) =>
    day.duration > current.duration ? day : current,
  );
  const focus: Focus =
    longest.duration >= COMBINED_MIN_DURATION &&
    hasRunEquipmentAt(longest.place)
      ? "COMBINED"
      : "CARDIO";
  return groups.map((group) =>
    group.map((day) => (day === longest ? { ...day, focus } : day)),
  );
};

/**
 * Groups the active weekdays and gives each day a focus, as spec section 3
 * defines. Consecutive active weekdays form a group, and a group runs from
 * Sunday into Monday. Children train PHASE on every day. Adults get their
 * focus by group size and training place, and an adult who trains more than
 * once a week without a CARDIO day gets one PHASE day converted to COMBINED
 * or CARDIO. The focus depends on the schedule and the training places only,
 * so the stage runs once per plan and every section reads the same focus per
 * weekday. The groups come in order of their first weekday.
 *
 * // The studio has a treadmill, the home has no run equipment.
 * assignTrainingDayFocus(mondayStudio60AndTuesdayHome45, adult)
 * → [[{ weekday: 0, duration: 60, place: "STUDIO", focus: "COMBINED" },
 *     { weekday: 1, duration: 45, place: "HOME", focus: "STABILITY" }]]
 */
export const assignTrainingDayFocus = (
  { weeklySchedule, trainingPlaces }: PlanGenerationInput,
  { ageGroup }: DerivedProfile,
): readonly TrainingDayGroup[] => {
  const groups = groupActiveDays(weeklySchedule);
  if (ageGroup === WorkoutConstants.AGE_GROUPS.CHILD) {
    return groups.map((days) => days.map((day) => withFocus(day, "PHASE")));
  }
  const hasRunEquipmentAt: RunEquipmentCheck = (place) =>
    hasRunEquipment(trainingPlaces[place]?.equipment ?? []);
  return applyWeeklyCardioGuarantee(
    groups.map((days) => assignGroupFocus(days, hasRunEquipmentAt)),
    hasRunEquipmentAt,
  );
};
