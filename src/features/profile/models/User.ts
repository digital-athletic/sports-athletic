import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";

export type UserType = {
  userId: string;
  isInInitialAnamnesis?: boolean;
  workoutData?: {
    gender?: "MALE" | "FEMALE";
    anamnesisCompleted?: boolean;
    seasonPhase?: SeasonPhaseType;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
