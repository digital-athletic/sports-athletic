import { act, renderHook } from "@testing-library/react-native";

import { useAnamnesisStore } from "../anamnesisStore";

describe("anamnesisStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAnamnesisStore());
    act(() => {
      result.current.resetData();
    });
  });

  describe("Initial State", () => {
    it("should have empty values object", () => {
      const { result } = renderHook(() => useAnamnesisStore());
      expect(result.current.values).toEqual({});
    });

    it("should have empty tags object", () => {
      const { result } = renderHook(() => useAnamnesisStore());
      expect(result.current.tags).toEqual({});
    });

    it("should have undefined originPath", () => {
      const { result } = renderHook(() => useAnamnesisStore());
      expect(result.current.originPath).toBeUndefined();
    });
  });

  describe("setValue", () => {
    it("should set a value by path", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setValue("user.height", 180);
      });

      expect(result.current.values["user.height"]).toBe(180);
    });

    it("should update existing value", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setValue("user.weight", 70);
        result.current.setValue("user.weight", 75);
      });

      expect(result.current.values["user.weight"]).toBe(75);
    });

    it("should handle multiple values", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
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
    it("should set tag values", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setTag("injury", ["knee", "ankle"]);
      });

      expect(result.current.tags.injury).toEqual(["knee", "ankle"]);
    });

    it("should update existing tag", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setTag("injury", ["knee"]);
        result.current.setTag("injury", ["knee", "ankle"]);
      });

      expect(result.current.tags.injury).toEqual(["knee", "ankle"]);
    });

    it("should handle multiple tags", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setTag("injury", ["knee"]);
        result.current.setTag("equipment", ["dumbbells", "barbell"]);
      });

      expect(result.current.tags).toEqual({
        injury: ["knee"],
        equipment: ["dumbbells", "barbell"],
      });
    });
  });

  describe("setOriginPath", () => {
    it("should set origin path", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setOriginPath("/(anamnesis)/anamnesis/sport");
      });

      expect(result.current.originPath).toBe("/(anamnesis)/anamnesis/sport");
    });

    it("should allow undefined origin path", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setOriginPath("/(anamnesis)/anamnesis/sport");
        result.current.setOriginPath(undefined);
      });

      expect(result.current.originPath).toBeUndefined();
    });
  });

  describe("resetData", () => {
    it("should reset all state except originPath", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setValue("user.height", 180);
        result.current.setTag("injury", ["knee"]);
        result.current.setOriginPath("/test");
        result.current.resetData();
      });

      expect(result.current.values).toEqual({});
      expect(result.current.tags).toEqual({});
      expect(result.current.originPath).toBe("/test"); // Should be preserved
    });
  });
});
