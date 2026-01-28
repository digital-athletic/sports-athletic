import { WorkoutConstants } from "@/constants/workoutConstants";
import type { MaxValuesType } from "./MaxValues";
import type { SeasonPhaseType } from "./SeasonPhase";

export type Sport = keyof typeof WorkoutConstants.SPORTS; // e.g., 'SOCCER', 'BASKETBALL', etc.

export type UserWorkoutDataType = {
  anamnesisCompleted: boolean;
  gender: "MALE" | "FEMALE";
  /** Date of birth in DD-MM-YYYY format */
  birthday: string;
  /** Body weight in kg. Valid range: 20-300 */
  weight: number;
  /** Height in cm. Valid range: 50-250 */
  height: number;
  sport: Sport;
  tags: string[];
  seasonPhase: SeasonPhaseType;
  maxValues: MaxValuesType;
};
