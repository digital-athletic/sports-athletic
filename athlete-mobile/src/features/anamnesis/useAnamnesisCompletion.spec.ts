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
      anamnesisResult.current.resetAnamnesisData();
      profileResult.current.resetProfile();
      workoutResult.current.resetUserWorkoutData();
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

    it("saves tags to userWorkoutStore.workoutData in structured format", () => {
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

      // Tags are now passed directly in structured format (no conversion)
      expect(workoutResult.current.workoutData.tags.LEVEL).toEqual([
        "ADVANCED",
      ]);
      expect(workoutResult.current.workoutData.tags.POSITION).toEqual(["GOAL"]);
    });

    it("resets the pain alert seen flag when the pains change", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        useUserWorkoutStore.getState().setTags({ PAIN: ["KNEE_LEFT"] });
        useUserProfileStore.getState().setWarningSeen("painAlertSeen", true);
        anamnesisResult.current.setTag("PAIN", ["KNEE_LEFT", "SPINE"]);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(useUserProfileStore.getState().warnings.painAlertSeen).toBe(false);
    });

    it("keeps the pain alert seen flag when the pains stay the same", () => {
      const { result: anamnesisResult } = renderHook(() => useAnamnesisStore());
      const { result: hookResult } = renderHook(() => useAnamnesisCompletion());

      act(() => {
        useUserWorkoutStore
          .getState()
          .setTags({ PAIN: ["KNEE_LEFT", "SPINE"] });
        useUserProfileStore.getState().setWarningSeen("painAlertSeen", true);
        anamnesisResult.current.setTag("PAIN", ["SPINE", "KNEE_LEFT"]);
      });

      act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(useUserProfileStore.getState().warnings.painAlertSeen).toBe(true);
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
