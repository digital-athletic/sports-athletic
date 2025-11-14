import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface ReviewStatusType {
  hasReviewed: boolean;
  lastPromptDate?: string;
  promptCount?: number;
}

export interface UserSettingsState {
  reviewStatus: ReviewStatusType;
  anonymisedDataUse: boolean;

  // Actions
  setSettings: (
    settings: Partial<
      Omit<
        UserSettingsState,
        "setSettings" | "setReviewStatus" | "setAnonymisedDataUse"
      >
    >
  ) => void;
  setReviewStatus: (status: ReviewStatusType) => void;
  setAnonymisedDataUse: (enabled: boolean) => void;
}

const DEFAULT_REVIEW_STATUS: ReviewStatusType = {
  hasReviewed: false,
  promptCount: 0,
};

/**
 * User Settings Store
 *
 * Manages app preferences and review state.
 * Independent from profile and workout data.
 *
 * @example
 * ```tsx
 * const { reviewStatus, anonymisedDataUse, setAnonymisedDataUse } = useUserSettingsStore();
 *
 * // Update privacy setting
 * setAnonymisedDataUse(true);
 *
 * // Update review status
 * setReviewStatus({ hasReviewed: true, lastPromptDate: '2025-11-14' });
 * ```
 */
export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    immer((set) => ({
      reviewStatus: DEFAULT_REVIEW_STATUS,
      anonymisedDataUse: false,

      setSettings: (settings) =>
        set((state) => {
          state.reviewStatus = settings.reviewStatus ?? state.reviewStatus;
          state.anonymisedDataUse =
            settings.anonymisedDataUse ?? state.anonymisedDataUse;
        }),

      setReviewStatus: (status) =>
        set((state) => {
          state.reviewStatus = status;
        }),

      setAnonymisedDataUse: (enabled) =>
        set((state) => {
          state.anonymisedDataUse = enabled;
        }),
    })),
    {
      name: "user-settings-storage",
      storage: asyncStorage,
    }
  )
);
