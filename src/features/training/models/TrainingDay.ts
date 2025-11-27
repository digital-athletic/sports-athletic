import { PlaceType } from "@/constants/workoutConstants";

export type TrainingDayType = {
  active: boolean;
  weekday: number; // 0-6 (Monday-Sunday)
  duration: number; // "hh:mm" format
  place: PlaceType;
};
