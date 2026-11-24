import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";

/**
 * Discards the drawn workouts of every custom workout the device no longer
 * stores, for example a team training the trainer removed or the training of
 * a team the athlete left.
 */
export const discardOrphanedDrawnWorkouts = (): void =>
  useDrawnWorkoutsStore
    .getState()
    .keepDrawnWorkoutsOf(
      Object.keys(useCustomWorkoutsStore.getState().workoutsById),
    );
