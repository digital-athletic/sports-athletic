/**
 * Places store - gym/studio equipment configuration.
 */

import type { PlacesState, StoreState } from "../types";

/**
 * Default studio equipment for a fully equipped gym.
 */
export const DEFAULT_EQUIPMENT = [
  "EQ_DUMBBELL",
  "EQ_BARBELL",
  "EQ_BENCH",
  "EQ_ADJUSTABLE_BENCH",
  "EQ_BARBELL_BENCH",
  "EQ_EXERCISING_BENCH",
  "EQ_POWER_RACK",
];

export interface PlacesStoreOptions {
  equipment?: string[];
}

export function createPlacesStore(
  options: PlacesStoreOptions = {},
): StoreState<PlacesState> {
  const { equipment = DEFAULT_EQUIPMENT } = options;

  return {
    state: {
      places: {
        STUDIO: {
          equipment,
        },
      },
    },
  };
}
