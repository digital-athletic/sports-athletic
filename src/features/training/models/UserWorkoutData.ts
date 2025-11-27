import { WorkoutConstants } from "@/constants/workoutConstants";
import type { MaxValuesType } from "./MaxValues";
import type { SeasonPhaseType } from "./SeasonPhase";

export type Sport = keyof typeof WorkoutConstants.SPORTS; // e.g., 'SOCCER', 'BASKETBALL', etc.

export type UserWorkoutDataType = {
  anamnesisCompleted: boolean;
  gender: "MALE" | "FEMALE";
  birthday: string; // DD-MM-YYYY
  weight: number;
  height: number; // TODO do we need this?
  sport: Sport;
  tags: string[];
  seasonPhase: SeasonPhaseType;
  maxValues: MaxValuesType;
};
