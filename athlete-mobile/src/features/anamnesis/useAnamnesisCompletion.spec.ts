import { renderHook, act } from "@testing-library/react-native";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useAnamnesisCompletion } from "./useAnamnesisCompletion";

describe("useAnamnesisCompletion", () => {
  beforeEach(async () => {
    const { result: anamnesisResult } = await renderHook(() =>
      useAnamnesisStore(),
    );
    const { result: profileResult } = await renderHook(() =>
      useUserProfileStore(),
    );
    const { result: workoutResult } = await renderHook(() =>
      useUserWorkoutStore(),
    );

    await act(() => {
      anamnesisResult.current.resetAnamnesisData();
      profileResult.current.resetProfile();
      workoutResult.current.resetUserWorkoutData();
    });
  });

  describe("saveAnamnesisData", () => {
    it("saves height to userProfileStore.personalData", async () => {
      const { result: anamnesisResult } = await renderHook(() =>
        useAnamnesisStore(),
      );
      const { result: profileResult } = await renderHook(() =>
        useUserProfileStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        anamnesisResult.current.setValue("height", 180);
      });

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.height).toBe(180);
    });

    it("saves weight to userProfileStore.personalData", async () => {
      const { result: anamnesisResult } = await renderHook(() =>
        useAnamnesisStore(),
      );
      const { result: profileResult } = await renderHook(() =>
        useUserProfileStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        anamnesisResult.current.setValue("weight", 75);
      });

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.weight).toBe(75);
    });

    it("saves tags to userWorkoutStore.workoutData in structured format", async () => {
      const { result: anamnesisResult } = await renderHook(() =>
        useAnamnesisStore(),
      );
      const { result: workoutResult } = await renderHook(() =>
        useUserWorkoutStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        anamnesisResult.current.setTag("LEVEL", ["ADVANCED"]);
        anamnesisResult.current.setTag("POSITION", ["GOAL"]);
      });

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      // Tags are now passed directly in structured format (no conversion)
      expect(workoutResult.current.workoutData.tags.LEVEL).toEqual([
        "ADVANCED",
      ]);
      expect(workoutResult.current.workoutData.tags.POSITION).toEqual(["GOAL"]);
    });

    it("resets the pain alert seen flag when the pains change", async () => {
      const { result: anamnesisResult } = await renderHook(() =>
        useAnamnesisStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        useUserWorkoutStore.getState().setTags({ PAIN: ["KNEE_LEFT"] });
        useUserProfileStore.getState().setWarningSeen("painAlertSeen", true);
        anamnesisResult.current.setTag("PAIN", ["KNEE_LEFT", "SPINE"]);
      });

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(useUserProfileStore.getState().warnings.painAlertSeen).toBe(false);
    });

    it("keeps the pain alert seen flag when the pains stay the same", async () => {
      const { result: anamnesisResult } = await renderHook(() =>
        useAnamnesisStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        useUserWorkoutStore
          .getState()
          .setTags({ PAIN: ["KNEE_LEFT", "SPINE"] });
        useUserProfileStore.getState().setWarningSeen("painAlertSeen", true);
        anamnesisResult.current.setTag("PAIN", ["SPINE", "KNEE_LEFT"]);
      });

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(useUserProfileStore.getState().warnings.painAlertSeen).toBe(true);
    });

    it("handles undefined height gracefully", async () => {
      const { result: profileResult } = await renderHook(() =>
        useUserProfileStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.height).toBeUndefined();
    });

    it("handles undefined weight gracefully", async () => {
      const { result: profileResult } = await renderHook(() =>
        useUserProfileStore(),
      );
      const { result: hookResult } = await renderHook(() =>
        useAnamnesisCompletion(),
      );

      await act(() => {
        hookResult.current.saveAnamnesisData();
      });

      expect(profileResult.current.personalData.weight).toBeUndefined();
    });
  });
});
