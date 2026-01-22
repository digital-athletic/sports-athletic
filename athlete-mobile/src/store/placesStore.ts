import { SharedConstants } from "@/constants/sharedConstants";
import { PlaceType } from "@/constants/workoutConstants";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import HALL from "../../assets/data/generator/places/HALL";
import HOME from "../../assets/data/generator/places/HOME";
import OUTSIDE from "../../assets/data/generator/places/OUTSIDE";
import STUDIO from "../../assets/data/generator/places/STUDIO";
import { asyncStorage } from "./middleware";

export type PlaceEquipment = {
  name: PlaceType;
  equipment: string[];
};

export type PlacesData = {
  HOME: PlaceEquipment;
  STUDIO: PlaceEquipment;
  HALL: PlaceEquipment;
  OUTSIDE: PlaceEquipment;
};

type State = {
  places: PlacesData;
};

const DEFAULT_PLACES: PlacesData = {
  HOME: {
    name: "HOME",
    equipment: HOME.EQUIPMENT,
  },
  STUDIO: {
    name: "STUDIO",
    equipment: STUDIO.EQUIPMENT,
  },
  HALL: {
    name: "HALL",
    equipment: HALL.EQUIPMENT,
  },
  OUTSIDE: {
    name: "OUTSIDE",
    equipment: OUTSIDE.EQUIPMENT,
  },
};

const DEFAULT_STATE: State = {
  places: DEFAULT_PLACES,
};

type Actions = {
  setPlaceEquipment: (placeId: PlaceType, equipment: string[]) => void;
  toggleEquipment: (placeId: PlaceType, equipmentId: string) => void;
  getPlaceEquipment: (placeId: PlaceType) => string[];
};

export type PlacesStoreState = State & Actions;

/**
 * Places Store
 *
 * Manages equipment available at different training locations.
 * Each place (HOME, STUDIO, HALL, OUTSIDE) has a list of available equipment.
 * Used during training plan generation to select appropriate exercises.
 *
 * @example
 * ```tsx
 * const { places, setPlaceEquipment, toggleEquipment } = usePlacesStore();
 *
 * // Get equipment for a specific place
 * const homeEquipment = places.HOME.equipment;
 *
 * // Set all equipment for a place
 * setPlaceEquipment('HOME', ['DUMBBELL', 'BLACK_ROLL']);
 *
 * // Toggle a single equipment item
 * toggleEquipment('STUDIO', 'BARBELL');
 * ```
 */
export const usePlacesStore = create<PlacesStoreState>()(
  persist(
    immer((set, get) => ({
      places: DEFAULT_PLACES,

      setPlaceEquipment: (placeId, equipment) =>
        set((state) => {
          state.places[placeId].equipment = equipment;
        }),

      toggleEquipment: (placeId, equipmentId) =>
        set((state) => {
          const equipment = state.places[placeId].equipment;
          const index = equipment.indexOf(equipmentId);

          if (index > -1) {
            equipment.splice(index, 1);
          } else {
            equipment.push(equipmentId);
          }
        }),

      getPlaceEquipment: (placeId) => get().places[placeId].equipment,
    })),
    {
      name: "places-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? DEFAULT_STATE
          : persistedState,
    },
  ),
);
