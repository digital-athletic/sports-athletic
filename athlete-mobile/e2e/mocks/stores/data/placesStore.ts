/**
 * Places store - training location equipment configuration.
 */

import type { PlacesState, StoreState } from "../types";
import STUDIO from "../../../../assets/data/generator/places/STUDIO";
import HOME from "../../../../assets/data/generator/places/HOME";
import HALL from "../../../../assets/data/generator/places/HALL";
import OUTSIDE from "../../../../assets/data/generator/places/OUTSIDE";

export const DEFAULT_HOME_EQUIPMENT = HOME.EQUIPMENT;
export const DEFAULT_STUDIO_EQUIPMENT = STUDIO.EQUIPMENT;
export const DEFAULT_HALL_EQUIPMENT = HALL.EQUIPMENT;
export const DEFAULT_OUTSIDE_EQUIPMENT = OUTSIDE.EQUIPMENT;

export interface PlacesStoreOptions {
  homeEquipment?: string[];
  studioEquipment?: string[];
  hallEquipment?: string[];
  outsideEquipment?: string[];
}

export function createPlacesStore(
  options: PlacesStoreOptions = {},
): StoreState<PlacesState> {
  const {
    homeEquipment = DEFAULT_HOME_EQUIPMENT,
    studioEquipment = DEFAULT_STUDIO_EQUIPMENT,
    hallEquipment = DEFAULT_HALL_EQUIPMENT,
    outsideEquipment = DEFAULT_OUTSIDE_EQUIPMENT,
  } = options;

  return {
    version: 14,
    state: {
      places: {
        HOME: {
          equipment: homeEquipment,
        },
        STUDIO: {
          equipment: studioEquipment,
        },
        HALL: {
          equipment: hallEquipment,
        },
        OUTSIDE: {
          equipment: outsideEquipment,
        },
      },
    },
  };
}
