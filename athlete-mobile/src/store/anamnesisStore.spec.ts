import { act, renderHook } from "@testing-library/react-native";

import { createInitialState, useAnamnesisStore } from "./anamnesisStore";

const DEFAULT_STATE = createInitialState();

describe("anamnesisStore", () => {
  beforeEach(async () => {
    // Reset store state before each test
    const { result } = await renderHook(() => useAnamnesisStore());
    await act(() => {
      result.current.resetAnamnesisData();
    });
  });

  describe("Initial State", () => {
    it("matches default values object", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());
      expect(result.current.values).toEqual(DEFAULT_STATE.values);
    });

    it("matches default tags object", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());
      expect(result.current.tags).toEqual(DEFAULT_STATE.tags);
    });
  });

  describe("setValue", () => {
    it("should set a value by path", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setValue("user.height", 180);
      });

      expect(result.current.values["user.height"]).toBe(180);
    });

    it("should update existing value", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setValue("user.weight", 70);
        result.current.setValue("user.weight", 75);
      });

      expect(result.current.values["user.weight"]).toBe(75);
    });

    it("should handle multiple values", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setValue("user.height", 180);
        result.current.setValue("user.weight", 70);
        result.current.setValue("user.age", 25);
      });

      expect(result.current.values).toEqual({
        "user.height": 180,
        "user.weight": 70,
        "user.age": 25,
      });
    });
  });

  describe("setTag", () => {
    it("should set tag values", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setTag("injury", ["knee", "ankle"]);
      });

      expect(result.current.tags.injury).toEqual(["knee", "ankle"]);
    });

    it("should update existing tag", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setTag("injury", ["knee"]);
        result.current.setTag("injury", ["knee", "ankle"]);
      });

      expect(result.current.tags.injury).toEqual(["knee", "ankle"]);
    });

    it("should handle multiple tags", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setTag("injury", ["knee"]);
        result.current.setTag("equipment", ["dumbbells", "barbell"]);
      });

      expect(result.current.tags.injury).toEqual(["knee"]);
      expect(result.current.tags.equipment).toEqual(["dumbbells", "barbell"]);
    });
  });

  describe("resetAnamnesisData", () => {
    it("should reset all state", async () => {
      const { result } = await renderHook(() => useAnamnesisStore());

      await act(() => {
        result.current.setValue("user.height", 180);
        result.current.setTag("injury", ["knee"]);
        result.current.resetAnamnesisData();
      });

      expect(result.current.values).toEqual(DEFAULT_STATE.values);
      expect(result.current.tags).toEqual(DEFAULT_STATE.tags);
    });
  });
});
