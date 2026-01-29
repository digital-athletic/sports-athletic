import { renderHook, act } from "@testing-library/react-native";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useAnamnesisCompletion } from "./useAnamnesisCompletion";

describe("useAnamnesisCompletion", () => {
  beforeEach(() => {
    const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
    const { result: profileResult } = renderHook(() => useUserProfileStore());
    const { result: workoutResult } = renderHook(() => useUserWorkoutStore());

    act(() => {
      anamnesisResult.current.clearAnamnesisData();
      profileResult.current.clearProfile();
      workoutResult.current.clearUserWorkoutData();
    });
  });

  describe("saveAnamnesisData", () => {
    it("saves height to userProfileStore.personalData", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: profileResult } = renderHook(() => useUserProfileStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        anamnesisResult.current.setValue("height", 180);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.height).toBe(180);
    });

    it("saves weight to userProfileStore.personalData", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: profileResult } = renderHook(() => useUserProfileStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        anamnesisResult.current.setValue("weight", 75);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.weight).toBe(75);
    });

    it("saves tags to userWorkoutStore.workoutData", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: workoutResult } = renderHook(() => useUserWorkoutStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        anamnesisResult.current.setTag("LEVEL", ["ADVANCED"]);
        anamnesisResult.current.setTag("POSITION", ["GOAL"]);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(workoutResult.current.workoutData.tags).toContain(
        "LEVEL_ADVANCED",
      );
      expect(workoutResult.current.workoutData.tags).toContain("POSITION_GOAL");
    });

    it("does NOT save height to userWorkoutStore (deprecated field)", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: workoutResult } = renderHook(() => useUserWorkoutStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        anamnesisResult.current.setValue("height", 999);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      // workoutData.height is deprecated and no longer set
      expect(workoutResult.current.workoutData.height).toBeUndefined();
    });

    it("does NOT save weight to userWorkoutStore (deprecated field)", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: workoutResult } = renderHook(() => useUserWorkoutStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        anamnesisResult.current.setValue("weight", 999);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      // workoutData.weight is deprecated and no longer set
      expect(workoutResult.current.workoutData.weight).toBeUndefined();
    });

    it("handles undefined height gracefully", () => {
      const { result: profileResult } = renderHook(() => useUserProfileStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.height).toBeUndefined();
    });

    it("handles undefined weight gracefully", () => {
      const { result: profileResult } = renderHook(() => useUserProfileStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.weight).toBeUndefined();
    });
  });
});
