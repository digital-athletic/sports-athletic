/**
 * Anamnesis store - user health/fitness questionnaire data.
 */

import { DEFAULT_USER, SEASON_END_DATE } from "../constants";
import type { AnamnesisState, StoreState } from "../types";

export interface AnamnesisStoreOptions {
  height?: number;
  weight?: number;
  tags?: Record<string, string[]>;
  seasonPhase?: {
    type: string;
    endDate: string;
  };
}

export function createAnamnesisStore(
  options: AnamnesisStoreOptions = {},
): StoreState<AnamnesisState> {
  const {
    height = DEFAULT_USER.height,
    weight = DEFAULT_USER.weight,
    tags = {
      LEVEL: ["BEGINNER"],
      POSITION: ["FIELD"],
      PAIN: [],
    },
    seasonPhase = {
      type: "COMPETITION",
      endDate: SEASON_END_DATE,
    },
  } = options;

  return {
    version: 15,
    state: {
      values: {
        height,
        weight,
      },
      tags,
      originPath: undefined,
      seasonPhase,
    },
  };
}
