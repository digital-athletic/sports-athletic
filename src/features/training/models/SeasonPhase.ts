export enum SeasonPhase {
  PAUSE = "PAUSE",
  PREPATORY = "PREPATORY",
  COMPETITION = "COMPETITION",
}

export type SeasonPhaseType = {
  type: SeasonPhase | null;
  numOfWeeks?: number;
  endDate: string; // DD-MM-YYYY
};
