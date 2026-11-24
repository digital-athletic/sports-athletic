import type { PlaceType } from "@/constants/workoutConstants";
import { readDrawnBlocks } from "@/features/customWorkouts/drawnWorkout";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  generateSetList,
  selectWorkout,
  type WorkoutGenerationRequest,
} from "@/features/training/workoutGeneratorRouter";
import {
  findCustomWorkout,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";

/**
 * Generates the set list of a training start. A custom workout replays its
 * drawn workout for the place while the custom workout is unchanged since the
 * draw. Otherwise it draws fresh and saves the draw, unless no block drew a
 * branch. Before the drawn workouts store hydrates, it draws fresh and saves
 * nothing.
 */
export const generateTrainingSetList = (
  random: () => number,
  request: WorkoutGenerationRequest & { place: PlaceType },
): GeneratedSetListEntry[] => {
  const selection = selectWorkout(request);
  const { drawnWorkouts, _hasHydrated, saveDrawnWorkout } =
    useDrawnWorkoutsStore.getState();
  const customWorkout = findCustomWorkout(
    useCustomWorkoutsStore.getState().workoutsById,
    request.type,
  );
  if (!customWorkout || !_hasHydrated) {
    return generateSetList(selection, request, { random }).setList;
  }
  // An entry saved before `modifiedAt` existed falls back to its import time.
  // The next team sync sets `modifiedAt` in the server format, which never
  // equals the fallback, so no stale draw replays.
  const modifiedAt =
    customWorkout.modifiedAt ??
    new Date(customWorkout.importedAt).toISOString();
  const drawnWorkout = drawnWorkouts[request.type]?.[request.place];
  if (drawnWorkout?.templateModifiedAt === modifiedAt) {
    const replay = { ...selection, workout: drawnWorkout.workout };
    return generateSetList(replay, request, { random }).setList;
  }
  const finished = generateSetList(selection, request, { random });
  const blocks = readDrawnBlocks(finished);
  if (blocks.length > 0) {
    saveDrawnWorkout(request.type, request.place, {
      templateModifiedAt: modifiedAt,
      workout: { ...customWorkout.template, blocks },
    });
  }
  return finished.setList;
};
