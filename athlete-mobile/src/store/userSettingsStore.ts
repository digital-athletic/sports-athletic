import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { userSettingsStoreMigrations } from "./migrations/userSettingsStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export interface ReviewStatusType {
  hasReviewed: boolean;
  lastPromptDate?: string;
  promptCount?: number;
}

export type ConsentStatus = "loading" | "accepted" | "missing";

export type State = {
  reviewStatus: ReviewStatusType;
  anonymisedDataUse: boolean;
  consentStatus: ConsentStatus;
};

const createInitialReviewStatus = (): ReviewStatusType => ({
  hasReviewed: false,
  promptCount: 0,
});

const createInitialState = (): State => ({
  reviewStatus: createInitialReviewStatus(),
  anonymisedDataUse: false,
  consentStatus: "loading",
});

type Actions = {
  setSettings: (
    settings: Partial<
      Omit<
        UserSettingsState,
        | "setSettings"
        | "setReviewStatus"
        | "setAnonymisedDataUse"
        | "setConsentStatus"
        | "resetSettings"
      >
    >,
  ) => void;
  setReviewStatus: (status: ReviewStatusType) => void;
  setAnonymisedDataUse: (enabled: boolean) => void;
  setConsentStatus: (status: ConsentStatus) => void;
  resetSettings: () => void;
};

export type UserSettingsState = State & Actions;

/**
 * User Settings Store
 *
 * Manages app preferences, review state, and consent status.
 * Independent from profile and workout data.
 *
 * @example
 * ```tsx
 * const { consentStatus, setConsentStatus } = useUserSettingsStore();
 * setConsentStatus('accepted');
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
          state.consentStatus = settings.consentStatus ?? state.consentStatus;
        }),

      setReviewStatus: (status) =>
        set((state) => {
          state.reviewStatus = status;
        }),

      setAnonymisedDataUse: (enabled) =>
        set((state) => {
          state.anonymisedDataUse = enabled;
        }),

      setConsentStatus: (status) =>
        set((state) => {
          state.consentStatus = status;
        }),

      resetSettings: () => {
        set((state) => {
          const initialState = createInitialState();
          state.reviewStatus = initialState.reviewStatus;
          state.anonymisedDataUse = initialState.anonymisedDataUse;
          state.consentStatus = initialState.consentStatus;
        });
      },
    })),
    {
      name: "user-settings-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.USER_SETTINGS,
      migrate: createMigrate(
        STORE_VERSIONS.USER_SETTINGS,
        userSettingsStoreMigrations,
        createInitialState,
        "user-settings",
      ),
    },
  ),
);
