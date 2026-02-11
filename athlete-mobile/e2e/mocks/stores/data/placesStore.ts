/**
 * Places store - gym/studio equipment configuration.
 */

import type { PlacesState, StoreState } from "../types";

/**
 * Default studio equipment for a fully equipped gym.
 */
export const DEFAULT_EQUIPMENT = [
  "DUMBBELL",
  "BARBELL",
  "BENCH",
  "ADJUSTABLE_BENCH",
  "BARBELL_BENCH",
  "EXERCISING_BENCH",
  "POWER_RACK",
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
