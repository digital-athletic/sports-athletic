import { PlaceType } from "@/constants/workoutConstants";
import type { DurationMinutes } from "./TimeUnits";

export type TrainingDayType = {
  active: boolean;
  weekday: number; // 0-6 (Monday-Sunday)
  /** Duration in minutes. Typical range: 15-120 */
  duration: DurationMinutes;
  place: PlaceType;
};
