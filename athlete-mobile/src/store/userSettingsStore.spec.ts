import { act, renderHook } from "@testing-library/react-native";
import { useUserSettingsStore } from "./userSettingsStore";

describe("userSettingsStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserSettingsStore());
    act(() => {
      result.current.resetSettings();
    });
  });

  describe("initial state", () => {
    it("has reviewStatus with hasReviewed false", () => {
      const { result } = renderHook(() => useUserSettingsStore());
      expect(result.current.reviewStatus.hasReviewed).toBe(false);
    });

    it("has anonymisedDataUse false", () => {
      const { result } = renderHook(() => useUserSettingsStore());
      expect(result.current.anonymisedDataUse).toBe(false);
    });
  });

  describe("setReviewStatus", () => {
    it("updates review status", () => {
      const { result } = renderHook(() => useUserSettingsStore());

      act(() => {
        result.current.setReviewStatus({
          hasReviewed: true,
          lastPromptDate: "2025-01-15",
        });
      });

      expect(result.current.reviewStatus.hasReviewed).toBe(true);
      expect(result.current.reviewStatus.lastPromptDate).toBe("2025-01-15");
    });
  });

  describe("setAnonymisedDataUse", () => {
    it("toggles consent flag", () => {
      const { result } = renderHook(() => useUserSettingsStore());

      act(() => {
        result.current.setAnonymisedDataUse(true);
      });

      expect(result.current.anonymisedDataUse).toBe(true);
    });
  });

  describe("resetSettings", () => {
    it("resets to initial state", () => {
      const { result } = renderHook(() => useUserSettingsStore());

      act(() => {
        result.current.setAnonymisedDataUse(true);
        result.current.setReviewStatus({ hasReviewed: true });
        result.current.resetSettings();
      });

      expect(result.current.anonymisedDataUse).toBe(false);
      expect(result.current.reviewStatus.hasReviewed).toBe(false);
    });
  });
});
