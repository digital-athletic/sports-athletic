import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { loadTemplate } from "@/data/loadTemplates";
import type { Template } from "@/schemas/aiwl.schema";
import {
  findCustomTemplate,
  generateCustomWorkoutId,
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "./customWorkoutsStore";

// e.g. { aiwl: 1, id: "MY_CORE", name: { en: "Core", de: "Rumpf" }, blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }] }
const generateCustomTemplate = (
  overrides: Partial<Template> = {},
): Template => ({
  aiwl: 1,
  id: "MY_CORE",
  name: { en: "Core", de: "Rumpf" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }],
  ...overrides,
});

describe("customWorkoutsStore: imported trainings", () => {
  beforeEach(async () => {
    const { result } = await renderHook(() => useCustomWorkoutsStore());
    await act(() => {
      result.current.clearCustomWorkouts();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("saveCustomWorkout", () => {
    it("returns an entry with a custom prefixed id, null team and the current time", async () => {
      jest.spyOn(Date, "now").mockReturnValue(1000);
      const { result } = await renderHook(() => useCustomWorkoutsStore());
      const template = generateCustomTemplate();

      let saved:
        | ReturnType<typeof result.current.saveCustomWorkout>
        | undefined;
      await act(() => {
        saved = result.current.saveCustomWorkout(template, null);
      });

      expect(saved?.id.startsWith("custom-")).toBe(true);
      expect(saved?.teamId).toBeNull();
      expect(saved?.importedAt).toBe(1000);
      expect(saved?.template).toEqual(template);
    });

    it("lists the saved entry for the own scope", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let savedId = "";
      await act(() => {
        savedId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
      });

      expect(
        listWorkoutsForTeam(result.current.workoutsById, null).map((w) => w.id),
      ).toEqual([savedId]);
    });

    it("keeps the app id when the same template id is saved again for the same team", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let firstId = "";
      let secondId = "";
      await act(() => {
        firstId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
        secondId = result.current.saveCustomWorkout(
          generateCustomTemplate({ name: { en: "Core v2" } }),
          null,
        ).id;
      });

      expect(firstId).not.toBe("");
      expect(secondId).toBe(firstId);
    });

    it("swaps the template and leaves one entry when the same template id is saved again", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
        result.current.saveCustomWorkout(
          generateCustomTemplate({ name: { en: "Core v2" } }),
          null,
        );
      });

      const entries = listWorkoutsForTeam(result.current.workoutsById, null);
      expect(entries).toHaveLength(1);
      expect(entries[0].template.name.en).toBe("Core v2");
    });

    it("sets importedAt to the re-import time when the same template id is saved again", async () => {
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1);
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });
      nowSpy.mockReturnValue(5);
      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });

      expect(
        listWorkoutsForTeam(result.current.workoutsById, null)[0]?.importedAt,
      ).toBe(5);
    });

    it("moves a re-imported entry behind newer entries", async () => {
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1);
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "A" }),
          null,
        );
      });
      nowSpy.mockReturnValue(2);
      await act(() => {
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "B" }),
          null,
        );
      });
      nowSpy.mockReturnValue(3);
      await act(() => {
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "A" }),
          null,
        );
      });

      expect(
        listWorkoutsForTeam(result.current.workoutsById, null).map(
          (w) => w.template.id,
        ),
      ).toEqual(["B", "A"]);
    });
  });

  describe("scope per team", () => {
    it("stores the same template id twice with different app ids for own and team scope", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let ownId = "";
      let teamEntryId = "";
      await act(() => {
        ownId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
        teamEntryId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          "team-1",
        ).id;
      });

      expect(Object.keys(result.current.workoutsById)).toHaveLength(2);
      expect(ownId).not.toBe(teamEntryId);
    });

    it("returns only the own entry for a null team", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let ownId = "";
      await act(() => {
        ownId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
        result.current.saveCustomWorkout(generateCustomTemplate(), "team-1");
      });

      expect(
        listWorkoutsForTeam(result.current.workoutsById, null).map((w) => w.id),
      ).toEqual([ownId]);
    });

    it("returns only the team entry for its team id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let teamEntryId = "";
      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
        teamEntryId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          "team-1",
        ).id;
      });

      expect(
        listWorkoutsForTeam(result.current.workoutsById, "team-1").map(
          (w) => w.id,
        ),
      ).toEqual([teamEntryId]);
    });
  });

  describe("sorting", () => {
    it("returns listWorkoutsForTeam entries oldest first", async () => {
      const nowSpy = jest.spyOn(Date, "now");
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        nowSpy.mockReturnValue(3);
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "C" }),
          null,
        );
        nowSpy.mockReturnValue(1);
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "A" }),
          null,
        );
        nowSpy.mockReturnValue(2);
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "B" }),
          null,
        );
      });

      expect(
        listWorkoutsForTeam(result.current.workoutsById, null).map(
          (w) => w.importedAt,
        ),
      ).toEqual([1, 2, 3]);
    });
  });

  describe("findCustomTemplate", () => {
    it("returns the template of an own entry by app id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());
      const template = generateCustomTemplate();

      let ownId = "";
      await act(() => {
        ownId = result.current.saveCustomWorkout(template, null).id;
      });

      expect(findCustomTemplate(result.current.workoutsById, ownId)).toEqual(
        template,
      );
    });

    it("returns the template of a team entry by app id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());
      const template = generateCustomTemplate({ name: { en: "Team core" } });

      let teamEntryId = "";
      await act(() => {
        teamEntryId = result.current.saveCustomWorkout(template, "team-1").id;
      });

      expect(
        findCustomTemplate(result.current.workoutsById, teamEntryId),
      ).toEqual(template);
    });

    it("returns undefined for an unknown id when another entry is saved", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });

      expect(
        findCustomTemplate(result.current.workoutsById, "custom-unknown"),
      ).toBeUndefined();
    });

    it("returns undefined for the file id of a saved entry that matches a bundled id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "PREV" }),
          null,
        );
      });

      expect(
        findCustomTemplate(result.current.workoutsById, "PREV"),
      ).toBeUndefined();
    });

    it("returns the saved template by app id when its file id matches a bundled id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());
      const template = generateCustomTemplate({ id: "PREV" });

      let savedId = "";
      await act(() => {
        savedId = result.current.saveCustomWorkout(template, null).id;
      });

      expect(findCustomTemplate(result.current.workoutsById, savedId)).toEqual(
        template,
      );
    });

    it("returns undefined for an inherited object key when another entry is saved", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });

      expect(
        findCustomTemplate(result.current.workoutsById, "constructor"),
      ).toBeUndefined();
    });
  });

  describe("clearCustomWorkouts", () => {
    it("empties workoutsById", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });
      expect(Object.keys(result.current.workoutsById)).toHaveLength(1);
      await act(() => {
        result.current.clearCustomWorkouts();
      });

      expect(result.current.workoutsById).toEqual({});
    });
  });

  describe("deleteOwnCustomWorkout", () => {
    it("removes an own entry by app id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let ownId = "";
      await act(() => {
        ownId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
      });
      await act(() => {
        result.current.deleteOwnCustomWorkout(ownId);
      });

      expect(result.current.workoutsById).toEqual({});
    });

    it("keeps the other own entries", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let firstId = "";
      let secondId = "";
      await act(() => {
        firstId = result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "A" }),
          null,
        ).id;
        secondId = result.current.saveCustomWorkout(
          generateCustomTemplate({ id: "B" }),
          null,
        ).id;
      });
      await act(() => {
        result.current.deleteOwnCustomWorkout(firstId);
      });

      expect(Object.keys(result.current.workoutsById)).toEqual([secondId]);
    });

    it("keeps a team entry with the given app id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let teamEntryId = "";
      await act(() => {
        teamEntryId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          "team-1",
        ).id;
      });
      await act(() => {
        result.current.deleteOwnCustomWorkout(teamEntryId);
      });

      expect(Object.keys(result.current.workoutsById)).toEqual([teamEntryId]);
    });

    it("leaves the store unchanged for an unknown app id", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });
      const before = result.current.workoutsById;
      await act(() => {
        result.current.deleteOwnCustomWorkout("custom-unknown");
      });

      expect(result.current.workoutsById).toBe(before);
    });

    it("removes the entry from async storage", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let ownId = "";
      await act(() => {
        ownId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
      });
      await act(() => {
        result.current.deleteOwnCustomWorkout(ownId);
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const raw = await AsyncStorage.getItem("custom-workouts-storage");
      const persisted: unknown = raw ? JSON.parse(raw) : null;
      expect(persisted).toMatchObject({ state: { workoutsById: {} } });
    });
  });

  describe("generateCustomWorkoutId", () => {
    it("returns a custom prefixed base36 id", () => {
      expect(generateCustomWorkoutId()).toMatch(/^custom-[0-9a-z]+$/);
    });

    it("never returns a bundled template key", () => {
      const id = generateCustomWorkoutId();

      expect(id.startsWith("custom-")).toBe(true);
      expect(loadTemplate(id)).toBeUndefined();
    });
  });

  describe("persistence", () => {
    it("writes the entry and version 14 to async storage after a save", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      let savedId = "";
      await act(() => {
        savedId = result.current.saveCustomWorkout(
          generateCustomTemplate(),
          null,
        ).id;
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const raw = await AsyncStorage.getItem("custom-workouts-storage");
      const persisted: unknown = raw ? JSON.parse(raw) : null;
      expect(persisted).toMatchObject({
        version: 14,
        state: { workoutsById: { [savedId]: { id: savedId, teamId: null } } },
      });
    });

    it("marks the store as hydrated after it rehydrates", async () => {
      useCustomWorkoutsStore.setState({ _hasHydrated: false });

      await useCustomWorkoutsStore.persist.rehydrate();

      expect(useCustomWorkoutsStore.getState()._hasHydrated).toBe(true);
    });

    it("writes no hydration flag to async storage", async () => {
      const { result } = await renderHook(() => useCustomWorkoutsStore());

      await act(() => {
        result.current.saveCustomWorkout(generateCustomTemplate(), null);
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const raw = await AsyncStorage.getItem("custom-workouts-storage");
      const persisted: unknown = raw ? JSON.parse(raw) : null;
      expect(persisted).not.toHaveProperty("state._hasHydrated");
    });
  });
});
