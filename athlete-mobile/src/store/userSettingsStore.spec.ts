import { act, renderHook } from "@testing-library/react-native";
import { useUserSettingsStore } from "./userSettingsStore";

describe("userSettingsStore", () => {
  beforeEach(async () => {
    const { result } = await renderHook(() => useUserSettingsStore());
    await act(() => {
      result.current.resetSettings();
    });
  });

  describe("initial state", () => {
    it("has reviewStatus with hasReviewed false", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());
      expect(result.current.reviewStatus.hasReviewed).toBe(false);
    });

    it("has anonymisedDataUse false", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());
      expect(result.current.anonymisedDataUse).toBe(false);
    });
  });

  describe("setReviewStatus", () => {
    it("updates review status", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());

      await act(() => {
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
    it("toggles consent flag", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());

      await act(() => {
        result.current.setAnonymisedDataUse(true);
      });

      expect(result.current.anonymisedDataUse).toBe(true);
    });
  });

  describe("resetSettings", () => {
    it("resets to initial state", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());

      await act(() => {
        result.current.setAnonymisedDataUse(true);
        result.current.setReviewStatus({ hasReviewed: true });
        result.current.resetSettings();
      });

      expect(result.current.anonymisedDataUse).toBe(false);
      expect(result.current.reviewStatus.hasReviewed).toBe(false);
    });
  });

  describe("acceptConsent", () => {
    it("sets consentStatus to accepted", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());

      await act(() => {
        result.current.acceptConsent();
      });

      expect(result.current.consentStatus).toBe("accepted");
    });

    it("does not modify anonymisedDataUse", async () => {
      const { result } = await renderHook(() => useUserSettingsStore());

      await act(() => {
        result.current.setAnonymisedDataUse(true);
        result.current.acceptConsent();
      });

      expect(result.current.anonymisedDataUse).toBe(true);
    });
  });
});
