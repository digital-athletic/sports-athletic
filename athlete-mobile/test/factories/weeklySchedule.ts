import type { PlaceType } from "@/constants/workoutConstants";
import { minutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { PlanGenerationInput } from "@/features/training/planGenerator/planGenerationInput/planGenerationInput";
import type { PlacesData } from "@/store/placesStore";
import { generatePlanGenerationInput } from "./planGenerationInput";

const DAYS_PER_WEEK = 7;

export interface ScheduledTrainingDay {
  /** 0 is Monday, 6 is Sunday. */
  readonly weekday: number;
  readonly place: PlaceType;
  readonly duration: number;
}

/**
 * Builds a weekly schedule of seven training days, Monday first. The given
 * days are active; every other weekday is an inactive 30-minute home day.
 *
 * generateWeeklySchedule([{ weekday: 6, place: "OUTSIDE", duration: 45 }])
 * → [{ active: false, weekday: 0, duration: 30, place: "HOME" }, ...,
 *    { active: true, weekday: 6, duration: 45, place: "OUTSIDE" }]
 */
export const generateWeeklySchedule = (
  activeDays: readonly ScheduledTrainingDay[],
): TrainingDayType[] =>
  Array.from({ length: DAYS_PER_WEEK }, (_, weekday) => {
    const activeDay = activeDays.find((day) => day.weekday === weekday);
    return activeDay
      ? {
          active: true,
          weekday,
          duration: minutes(activeDay.duration),
          place: activeDay.place,
        }
      : { active: false, weekday, duration: minutes(30), place: "HOME" };
  });

const equipmentOf = (
  place: PlaceType,
  placesWithRunEquipment: readonly PlaceType[],
): string[] =>
  placesWithRunEquipment.includes(place)
    ? ["DUMBBELL", "TREADMILL"]
    : ["DUMBBELL"];

/**
 * Builds the four training places with dumbbells; the given places also hold
 * a treadmill, which counts as run equipment.
 *
 * generateTrainingPlaces(["STUDIO"])
 * → { HOME: { equipment: ["DUMBBELL"] },
 *     STUDIO: { equipment: ["DUMBBELL", "TREADMILL"] }, HALL: ..., OUTSIDE: ... }
 */
export const generateTrainingPlaces = (
  placesWithRunEquipment: readonly PlaceType[] = [],
): PlacesData => ({
  HOME: { equipment: equipmentOf("HOME", placesWithRunEquipment) },
  STUDIO: { equipment: equipmentOf("STUDIO", placesWithRunEquipment) },
  HALL: { equipment: equipmentOf("HALL", placesWithRunEquipment) },
  OUTSIDE: { equipment: equipmentOf("OUTSIDE", placesWithRunEquipment) },
});

/**
 * Builds a plan generation input with the given active days and the training
 * places of generateTrainingPlaces.
 *
 * generateScheduledPlanGenerationInput(
 *   [{ weekday: 0, place: "STUDIO", duration: 60 }], ["STUDIO"])
 * → { ..., weeklySchedule: [Monday STUDIO 60, six inactive days],
 *     trainingPlaces: { STUDIO: { equipment: ["DUMBBELL", "TREADMILL"] }, ... } }
 */
export const generateScheduledPlanGenerationInput = (
  activeDays: readonly ScheduledTrainingDay[],
  placesWithRunEquipment: readonly PlaceType[] = [],
): PlanGenerationInput =>
  generatePlanGenerationInput({
    weeklySchedule: generateWeeklySchedule(activeDays),
    trainingPlaces: generateTrainingPlaces(placesWithRunEquipment),
  });
