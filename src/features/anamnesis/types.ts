export type LocalizedText = {
  [language: string]: string;
  default: string;
};

export type TrainingDayType = {
  active: boolean;
  [key: string]: unknown;
};

export type SeasonPhaseType = {
  endDate: string;
  type: string;
  [key: string]: unknown;
};

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
