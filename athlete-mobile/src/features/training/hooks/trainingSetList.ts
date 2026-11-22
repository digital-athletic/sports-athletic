import type { PlaceType } from "@/constants/workoutConstants";
import { generateVersionedSetList } from "@/features/customWorkouts/savedVersion";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  generateWorkout,
  selectWorkout,
  type WorkoutGenerationRequest,
} from "@/features/training/workoutGeneratorRouter";
import {
  type CustomWorkoutsState,
  findCustomTemplate,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import {
  type SetListVersionsState,
  useSetListVersionsStore,
} from "@/store/setListVersionsStore";

/** The store state a training start reads and writes for saved versions. */
export type SetListVersionsContext = {
  workoutsById: CustomWorkoutsState["workoutsById"];
  versionsByWorkout: SetListVersionsState["versionsByWorkout"];
  versionsHydrated: boolean;
  saveVersion: SetListVersionsState["saveVersion"];
};

export const useSetListVersionsContext = (): SetListVersionsContext => {
  const { workoutsById } = useCustomWorkoutsStore();
  const { versionsByWorkout, _hasHydrated, saveVersion } =
    useSetListVersionsStore();
  return {
    workoutsById,
    versionsByWorkout,
    versionsHydrated: _hasHydrated,
    saveVersion,
  };
};

/**
 * Generates the set list of a training start. A custom workout replays its
 * saved version for the place, or saves its first set list there. Before the
 * versions store hydrates, a custom workout generates fresh and saves nothing.
 */
export const generateTrainingSetList = (
  ctx: SetListVersionsContext,
  request: WorkoutGenerationRequest & { place: PlaceType },
): GeneratedSetListEntry[] => {
  const selection = selectWorkout(request);
  const isCustom = findCustomTemplate(ctx.workoutsById, request.type);
  if (!isCustom || !ctx.versionsHydrated) {
    return generateWorkout(selection, request).setList;
  }
  const { setList, versionToSave } = generateVersionedSetList({
    request,
    selection,
    saved: ctx.versionsByWorkout[request.type]?.[request.place],
  });
  if (versionToSave) {
    ctx.saveVersion(request.type, request.place, versionToSave);
  }
  return setList;
};
