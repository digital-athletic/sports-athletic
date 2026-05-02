import type { StoreState } from "../types";

export type ConsentStatus = "loading" | "accepted" | "missing";

export interface UserSettingsState {
  reviewStatus: { hasReviewed: boolean; promptCount: number };
  anonymisedDataUse: boolean;
  consentStatus: ConsentStatus;
}

export interface UserSettingsStoreOptions {
  consentStatus?: ConsentStatus;
  anonymisedDataUse?: boolean;
}

export function createUserSettingsStore(
  options: UserSettingsStoreOptions = {},
): StoreState<UserSettingsState> {
  const { consentStatus = "accepted", anonymisedDataUse = false } = options;

  return {
    version: 15,
    state: {
      reviewStatus: { hasReviewed: false, promptCount: 0 },
      anonymisedDataUse,
      consentStatus,
    },
  };
}
