import { type SeasonPhaseSchemaType } from "@/schemas/user.schema";

export enum SeasonPhase {
  PAUSE = "PAUSE",
  PREPARATORY = "PREPARATORY",
  COMPETITION = "COMPETITION",
}

export type SeasonPhaseType = SeasonPhaseSchemaType;
