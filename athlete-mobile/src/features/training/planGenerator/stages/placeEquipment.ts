import type { PlaceType } from "@/constants/workoutConstants";
import type { PlacesData } from "@/store/placesStore";

/**
 * Reads the equipment of a training place. A place the input lacks has no
 * equipment.
 *
 * readPlaceEquipment({ STUDIO: { equipment: ["DUMBBELL"] }, ... }, "STUDIO")
 * → ["DUMBBELL"]
 */
export const readPlaceEquipment = (
  trainingPlaces: PlacesData,
  place: PlaceType,
): string[] => trainingPlaces[place]?.equipment ?? [];
