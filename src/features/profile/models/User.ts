import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";

// Legacy: legacy/models/User.js
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
  // TODO: Add missing fields (See: https://github.com/sports-athletics/sports-athletic/issues/114)
  /**
   * temporalData: Array<TemporalDataType>,
   * settings: UserSettingsType,
   * statistics: UserStatisticsType,
   * trainingPlan: ?TrainingPlanType,
   * teamId: string,
   */
};
