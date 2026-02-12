import { SharedConstants } from "@/constants/sharedConstants";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface ReviewStatusType {
  hasReviewed: boolean;
  lastPromptDate?: string;
  promptCount?: number;
}

type State = {
  reviewStatus: ReviewStatusType;
  anonymisedDataUse: boolean;
};

const createInitialReviewStatus = (): ReviewStatusType => ({
  hasReviewed: false,
  promptCount: 0,
});

const createInitialState = (): State => ({
  reviewStatus: createInitialReviewStatus(),
  anonymisedDataUse: false,
});

type Actions = {
  setSettings: (
    settings: Partial<
      Omit<
        UserSettingsState,
        "setSettings" | "setReviewStatus" | "setAnonymisedDataUse"
      >
    >,
  ) => void;
  setReviewStatus: (status: ReviewStatusType) => void;
  setAnonymisedDataUse: (enabled: boolean) => void;
  resetSettings: () => void;
};

export type UserSettingsState = State & Actions;

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
      ...createInitialState(),

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
      resetSettings: () => {
        set((state) => {
          const initialState = createInitialState();
          state.reviewStatus = initialState.reviewStatus;
          state.anonymisedDataUse = initialState.anonymisedDataUse;
        });
      },
    })),
    {
      name: "user-settings-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);
