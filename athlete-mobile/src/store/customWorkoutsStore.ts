import type { Template } from "@/schemas/aiwl.schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { customWorkoutsStoreMigrations } from "./migrations/customWorkoutsStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type CustomWorkout = {
  id: string;
  teamId: string | null;
  template: Template;
  importedAt: number;
  /**
   * ISO time of the last change: the save time of an own training, the
   * server's updated_at of a team training. Missing on entries saved before
   * it existed; read it with `readModifiedAt`.
   */
  modifiedAt?: string;
  /** True for a team draft, which only the owner and co-owners receive. */
  isDraft?: boolean;
};

/** A team workout as one sync returns it, e.g. { template, modifiedAt: "2026-11-01T08:00:00.123456+00:00" }. */
export type TeamWorkoutInput = Pick<CustomWorkout, "template" | "isDraft"> & {
  modifiedAt: string;
};

export type State = { workoutsById: Record<string, CustomWorkout> };

const createInitialState = (): State => ({ workoutsById: {} });

export const listWorkoutsForTeam = (
  workoutsById: State["workoutsById"],
  teamId: string | null,
): CustomWorkout[] =>
  Object.values(workoutsById)
    .filter((workout) => workout.teamId === teamId)
    .sort((a, b) => a.importedAt - b.importedAt);

export const findCustomWorkout = (
  workoutsById: State["workoutsById"],
  id: string,
): CustomWorkout | undefined =>
  Object.hasOwn(workoutsById, id) ? workoutsById[id] : undefined;

export const findCustomTemplate = (
  workoutsById: State["workoutsById"],
  id: string,
): Template | undefined => findCustomWorkout(workoutsById, id)?.template;

/**
 * The last change of an entry. An entry without `modifiedAt` falls back to
 * its import time: an own training's last save, or for a team training a
 * time that holds until the next sync, which sets `modifiedAt` in the
 * server format that never equals the fallback. So no stale draw replays.
 */
export const readModifiedAt = (workout: CustomWorkout): string =>
  workout.modifiedAt ?? new Date(workout.importedAt).toISOString();

type Actions = {
  saveCustomWorkout: (
    template: Template,
    teamId: string | null,
  ) => CustomWorkout;
  deleteOwnCustomWorkout: (id: string) => void;
  replaceTeamWorkouts: (teamId: string, workouts: TeamWorkoutInput[]) => void;
  keepTeamWorkoutsOf: (teamIds: string[]) => void;
  clearCustomWorkouts: () => void;
  setHasHydrated: (hydrated: boolean) => void;
};

export type CustomWorkoutsState = State & { _hasHydrated: boolean } & Actions;

export const generateCustomWorkoutId = (): string =>
  `custom-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;

const removeWorkoutsWhere = (
  state: State,
  shouldRemove: (workout: CustomWorkout) => boolean,
): void => {
  for (const workout of Object.values(state.workoutsById)) {
    if (shouldRemove(workout)) delete state.workoutsById[workout.id];
  }
};

// importedAt counts up in server order, so the list follows that order.
// A template id from the previous sync reuses its app id.
const replaceTeamEntries = (
  state: State,
  teamId: string,
  workouts: TeamWorkoutInput[],
): void => {
  const appIds = new Map(
    listWorkoutsForTeam(state.workoutsById, teamId).map((workout) => [
      workout.template.id,
      workout.id,
    ]),
  );
  removeWorkoutsWhere(state, (workout) => workout.teamId === teamId);
  const now = Date.now();
  workouts.forEach(({ template, modifiedAt, isDraft }, index) => {
    const id = appIds.get(template.id) ?? generateCustomWorkoutId();
    state.workoutsById[id] = {
      id,
      teamId,
      template,
      importedAt: now + index,
      modifiedAt,
      ...(isDraft === true && { isDraft }),
    };
  });
};

// A save replaces the entry of the same template id in the scope and keeps its app id.
const createSavedEntry = (
  workoutsById: State["workoutsById"],
  template: Template,
  teamId: string | null,
): CustomWorkout => {
  const existing = Object.values(workoutsById).find(
    (workout) =>
      workout.teamId === teamId && workout.template.id === template.id,
  );
  const now = Date.now();
  return {
    id: existing?.id ?? generateCustomWorkoutId(),
    teamId,
    template,
    importedAt: now,
    modifiedAt: new Date(now).toISOString(),
  };
};

export const useCustomWorkoutsStore = create<CustomWorkoutsState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),
      _hasHydrated: false,

      saveCustomWorkout: (template, teamId) => {
        const entry = createSavedEntry(get().workoutsById, template, teamId);
        set((state) => {
          state.workoutsById[entry.id] = entry;
        });
        return entry;
      },

      deleteOwnCustomWorkout: (id) => {
        const { workoutsById } = get();
        const workout = Object.hasOwn(workoutsById, id)
          ? workoutsById[id]
          : undefined;
        // Team trainings belong to the coaching team, so athletes can only delete their own.
        if (workout?.teamId !== null) {
          return;
        }
        set((state) => {
          delete state.workoutsById[id];
        });
      },

      replaceTeamWorkouts: (...args) =>
        set((state) => replaceTeamEntries(state, ...args)),

      keepTeamWorkoutsOf: (teamIds) =>
        set((state) =>
          removeWorkoutsWhere(
            state,
            ({ teamId }) => teamId !== null && !teamIds.includes(teamId),
          ),
        ),

      clearCustomWorkouts: () =>
        set((state) => {
          state.workoutsById = createInitialState().workoutsById;
        }),

      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),
    })),
    {
      name: "custom-workouts-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.CUSTOM_WORKOUTS,
      migrate: createMigrate(
        STORE_VERSIONS.CUSTOM_WORKOUTS,
        customWorkoutsStoreMigrations,
        createInitialState,
        "custom-workouts",
      ),
      partialize: (state): State => ({ workoutsById: state.workoutsById }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating custom workouts store:", error);
        }
        useCustomWorkoutsStore.getState().setHasHydrated(true);
      },
    },
  ),
);
