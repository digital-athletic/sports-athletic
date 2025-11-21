import { act, renderHook } from "@testing-library/react-native";

import type { AnamnesisQuestionGroupType } from "../anamnesisStore";
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
    it("should have empty questions array", () => {
      const { result } = renderHook(() => useAnamnesisStore());
      expect(result.current.questions).toEqual([]);
    });

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

    it("should not be loading", () => {
      const { result } = renderHook(() => useAnamnesisStore());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("setQuestions", () => {
    it("should set questions array", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      const mockQuestions: AnamnesisQuestionGroupType[] = [
        {
          groupTitle: "Personal Info",
          ordering: 1,
          questions: [
            {
              title: { default: "What is your name?" },
              placeholder: { default: "Enter name" },
              type: "text",
              dataField: "user.name",
            },
          ],
        },
      ];

      act(() => {
        result.current.setQuestions(mockQuestions);
      });

      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.questions).toHaveLength(1);
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
        result.current.setOriginPath("/anamnesis/sport");
      });

      expect(result.current.originPath).toBe("/anamnesis/sport");
    });

    it("should allow undefined origin path", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      act(() => {
        result.current.setOriginPath("/anamnesis/sport");
        result.current.setOriginPath(undefined);
      });

      expect(result.current.originPath).toBeUndefined();
    });
  });

  describe("resetData", () => {
    it("should reset all state except originPath", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      const mockQuestions: AnamnesisQuestionGroupType[] = [
        {
          groupTitle: "Test",
          ordering: 1,
          questions: [],
        },
      ];

      act(() => {
        result.current.setQuestions(mockQuestions);
        result.current.setValue("user.height", 180);
        result.current.setTag("injury", ["knee"]);
        result.current.setOriginPath("/test");
        result.current.resetData();
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.values).toEqual({});
      expect(result.current.tags).toEqual({});
      expect(result.current.originPath).toBe("/test"); // Should be preserved
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("fillData", () => {
    it("should fill values from workoutData", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      const mockQuestions: AnamnesisQuestionGroupType[] = [
        {
          groupTitle: "Workout Data",
          ordering: 1,
          questions: [
            {
              title: { default: "Height" },
              placeholder: { default: "Height" },
              type: "text",
              dataField: "height",
            },
            {
              title: { default: "Weight" },
              placeholder: { default: "Weight" },
              type: "text",
              dataField: "weight",
            },
          ],
        },
      ];

      act(() => {
        result.current.setQuestions(mockQuestions);
        result.current.fillData([], {
          height: 180,
          weight: 70,
        });
      });

      expect(result.current.values).toEqual({
        height: 180,
        weight: 70,
      });
    });

    it("should fill tags from tags array", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      const mockQuestions: AnamnesisQuestionGroupType[] = [
        {
          groupTitle: "Tags",
          ordering: 1,
          questions: [
            {
              title: { default: "Injuries" },
              placeholder: { default: "Select injuries" },
              type: "selectMultiple",
              tag: "injury",
            },
          ],
        },
      ];

      act(() => {
        result.current.setQuestions(mockQuestions);
        result.current.fillData(
          ["injury_knee", "injury_ankle", "equipment_dumbbells"],
          {}
        );
      });

      expect(result.current.tags.injury).toEqual([
        "injury_knee",
        "injury_ankle",
      ]);
    });

    it("should handle both tags and values together", () => {
      const { result } = renderHook(() => useAnamnesisStore());

      const mockQuestions: AnamnesisQuestionGroupType[] = [
        {
          groupTitle: "Mixed",
          ordering: 1,
          questions: [
            {
              title: { default: "Height" },
              placeholder: { default: "Height" },
              type: "text",
              dataField: "height",
            },
            {
              title: { default: "Injuries" },
              placeholder: { default: "Select injuries" },
              type: "selectMultiple",
              tag: "injury",
            },
          ],
        },
      ];

      act(() => {
        result.current.setQuestions(mockQuestions);
        result.current.fillData(["injury_knee"], { height: 180 });
      });

      expect(result.current.values).toEqual({ height: 180 });
      expect(result.current.tags).toEqual({ injury: ["injury_knee"] });
    });
  });

  describe("loadQuestions", () => {
    it("should load empty questions array (stub implementation)", async () => {
      const { result } = renderHook(() => useAnamnesisStore());

      await act(async () => {
        await result.current.loadQuestions();
      });

      // Current stub implementation returns empty array
      expect(result.current.questions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should reset isLoading after load completes", async () => {
      const { result } = renderHook(() => useAnamnesisStore());

      await act(async () => {
        await result.current.loadQuestions();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
