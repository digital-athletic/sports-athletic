import type { PlaceType } from "@/constants/workoutConstants";
import { generateSetListFromDrawnWorkout } from "@/features/customWorkouts/drawnWorkout";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  generateSetList,
  selectWorkout,
  type WorkoutGenerationRequest,
} from "@/features/training/workoutGeneratorRouter";
import {
  type CustomWorkoutsState,
  findCustomTemplate,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import {
  type DrawnWorkoutsState,
  useDrawnWorkoutsStore,
} from "@/store/drawnWorkoutsStore";

/** The store state a training start reads and writes for drawn workouts. */
export type DrawnWorkoutsContext = {
  workoutsById: CustomWorkoutsState["workoutsById"];
  drawnWorkouts: DrawnWorkoutsState["drawnWorkouts"];
  drawnWorkoutsHydrated: boolean;
  saveDrawnWorkout: DrawnWorkoutsState["saveDrawnWorkout"];
};

export const useDrawnWorkoutsContext = (): DrawnWorkoutsContext => {
  const { workoutsById } = useCustomWorkoutsStore();
  const { drawnWorkouts, _hasHydrated, saveDrawnWorkout } =
    useDrawnWorkoutsStore();
  return {
    workoutsById,
    drawnWorkouts,
    drawnWorkoutsHydrated: _hasHydrated,
    saveDrawnWorkout,
  };
};

/**
 * Generates the set list of a training start. A custom workout replays its
 * drawn workout for the place, or saves its first draw there. Before the
 * drawn workouts store hydrates, a custom workout generates fresh and saves
 * nothing.
 */
export const generateTrainingSetList = (
  ctx: DrawnWorkoutsContext,
  random: () => number,
  request: WorkoutGenerationRequest & { place: PlaceType },
): GeneratedSetListEntry[] => {
  const selection = selectWorkout(request);
  const template = findCustomTemplate(ctx.workoutsById, request.type);
  if (!template || !ctx.drawnWorkoutsHydrated) {
    return generateSetList(selection, request, { random }).setList;
  }
  const { setList, drawnWorkoutToSave } = generateSetListFromDrawnWorkout({
    request,
    selection,
    template,
    drawnWorkout: ctx.drawnWorkouts[request.type]?.[request.place],
    random,
  });
  if (drawnWorkoutToSave) {
    ctx.saveDrawnWorkout(request.type, request.place, drawnWorkoutToSave);
  }
  return setList;
};
