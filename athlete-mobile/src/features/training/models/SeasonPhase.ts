import { type SeasonPhaseSchemaType } from "@/schemas/user.schema";

export enum SeasonPhase {
  PAUSE = "PAUSE",
  PREPATORY = "PREPATORY",
  COMPETITION = "COMPETITION",
}

export type SeasonPhaseType = SeasonPhaseSchemaType;
